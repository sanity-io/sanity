import {type InferredParam, type ParamType} from '../paramInference'
import {toQueryVariableName} from './naming'
import {indent, printLiteralKey, printTypeKey} from './printUtils'

/** Beyond this, a union or a list of values goes on lines of its own, as a formatter would put it */
const MAX_LINE_LENGTH = 80

const UNKNOWN_COMMENT = 'Could not be inferred from the query'

const FORMAT_COMMENTS: Partial<Record<NonNullable<ParamType['format']>, string>> = {
  'document-id': 'Document ID',
  'datetime': 'ISO 8601 date and time',
}

/** `*[_type == "author"]` becomes `AuthorQueryParams`, next to the result's `AuthorQueryResult` */
export function toParamsTypeName(query: string): string {
  const variableName = toQueryVariableName(query)
  return `${variableName.charAt(0).toUpperCase()}${variableName.slice(1)}Params`
}

/** The comment above a param's property, when its type says less than the inference knows */
function printComment(type: ParamType): string[] {
  const comment =
    type.kind === 'any' ? UNKNOWN_COMMENT : type.format && FORMAT_COMMENTS[type.format]
  return comment ? [`${indent(1)}/** ${comment} */`] : []
}

/** The literal values a param is compared with; none for an open string */
function literals(type: ParamType): string[] | undefined {
  return type.kind === 'string' && type.options && type.options.length > 0
    ? type.options.map((option) => JSON.stringify(option))
    : undefined
}

function fits(line: string): boolean {
  return line.length <= MAX_LINE_LENGTH
}

function printTypeScriptProperty(param: InferredParam): string[] {
  const {type} = param
  const key = `${indent(1)}${printTypeKey(param.name)}:`
  if (type.kind === 'any') return [...printComment(type), `${key} unknown;`]

  const values = literals(type) ?? [type.kind === 'integer' ? 'number' : type.kind]
  const nullable = param.nullable ? ' | null' : ''
  let property: string
  if (type.array) {
    const line = `${key} Array<${values.join(' | ')}>${nullable};`
    property =
      fits(line) || values.length < 2
        ? line
        : [
            `${key} Array<`,
            ...values.map((value) => `${indent(2)}| ${value}`),
            `${indent(1)}>${nullable};`,
          ].join('\n')
  } else {
    const members = param.nullable ? [...values, 'null'] : values
    const line = `${key} ${members.join(' | ')};`
    property =
      fits(line) || members.length < 2
        ? line
        : [key, ...members.map((member) => `${indent(2)}| ${member}`)].join('\n') + ';'
  }
  return [...printComment(type), property]
}

/**
 * Prints the params a query uses as an exported TypeScript type, in the style `sanity typegen`
 * prints result types: `Array<T>`, string literals in double quotes, and every param required,
 * since the API rejects a query that references a param it was not sent.
 */
export function printParamsTypeScript(params: InferredParam[], typeName: string): string {
  if (params.length === 0) return `export type ${typeName} = Record<string, never>;`
  return `export type ${typeName} = {\n${params.flatMap(printTypeScriptProperty).join('\n')}\n};`
}

function printZodScalar(type: ParamType): string {
  switch (type.kind) {
    case 'string':
      return type.format === 'datetime' ? 'z.string().datetime({offset: true})' : 'z.string()'
    case 'integer':
      return 'z.number().int()'
    case 'number':
      return 'z.number()'
    case 'boolean':
      return 'z.boolean()'
    case 'any':
      return 'z.unknown()'
    default: {
      const exhaustive: never = type.kind
      return exhaustive
    }
  }
}

/** The schema of one value, as lines indented for `depth`; a long enum lists a value per line */
function printZodValue(type: ParamType, depth: number, room: number): string[] {
  const values = literals(type)
  if (!values) return [printZodScalar(type)]
  if (values.length === 1) return [`z.literal(${values[0]})`]
  const line = `z.enum([${values.join(', ')}])`
  if (line.length <= room) return [line]
  return [
    'z.enum([',
    ...values.map((value) => `${indent(depth + 1)}${value},`),
    `${indent(depth)}])`,
  ]
}

function printZodProperty(param: InferredParam): string[] {
  const {type} = param
  const key = `${indent(1)}${printLiteralKey(param.name)}: `
  const suffix = `${param.nullable && type.kind !== 'any' ? '.nullable()' : ''},`
  let value: string[]
  if (type.array) {
    const element = printZodValue(type, 2, Infinity)
    const line = `z.array(${element.join('')})`
    value = fits(`${key}${line}${suffix}`)
      ? [line]
      : [
          'z.array(',
          `${indent(2)}${printZodValue(type, 2, MAX_LINE_LENGTH - indent(2).length - 1).join('\n')},`,
          `${indent(1)})`,
        ]
  } else {
    value = printZodValue(type, 1, MAX_LINE_LENGTH - key.length - suffix.length)
  }
  return [...printComment(type), `${key}${value.join('\n')}${suffix}`]
}

/**
 * Prints the params a query uses as a Zod object schema, followed by the type inferred from it,
 * in the style of the result's Zod export.
 */
export function printParamsZod(params: InferredParam[], typeName: string): string {
  const schemaName = `${typeName}Schema`
  const body =
    params.length === 0
      ? 'z.object({})'
      : `z.object({\n${params.flatMap(printZodProperty).join('\n')}\n})`
  return [
    `import {z} from 'zod'`,
    `export const ${schemaName} = ${body}`,
    `export type ${typeName} = z.infer<typeof ${schemaName}>`,
  ].join('\n\n')
}
