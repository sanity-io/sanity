import {type ObjectAttribute, type SchemaType, type TypeNode} from 'groq-js'

import {type InferredParam} from '../paramInference'
import {toQueryVariableName} from './naming'
import {joinKeyAndValue, printTypeScript} from './printTypeScript'
import {indent, printLiteralKey, printTypeKey} from './printUtils'
import {printZod} from './printZod'

export interface PrintParamsOptions {
  /** Name of the exported params type (see `toParamsTypeName`); its Zod schema adds `Schema` */
  typeName: string
  /** Schema the `inline` references point into; the types referenced are emitted as well */
  schema?: SchemaType
}

const UNKNOWN: TypeNode = {type: 'unknown'}

/** `*[_type == "author"]` becomes `AuthorQueryParams`, next to the result's `AuthorQueryResult` */
export function toParamsTypeName(query: string): string {
  const variableName = toQueryVariableName(query)
  return `${variableName.charAt(0).toUpperCase()}${variableName.slice(1)}Params`
}

/** The type a param's property is printed with: what the query expects, else its value's */
function printedNode(param: InferredParam): TypeNode {
  return param.node.type === 'unknown' ? (param.valueNode ?? UNKNOWN) : param.node
}

function isPlain(node: TypeNode, type: 'string' | 'number'): boolean {
  return node.type === type && node.value === undefined
}

/** The comment above a param's property, when the inference knows more than its type says */
function printComment(param: InferredParam): string | undefined {
  if (param.node.type === 'unknown') {
    return param.valueNode
      ? `Typed from its current value because ${param.reason}`
      : `Could not be inferred because ${param.reason}`
  }
  switch (param.type.format) {
    case 'document-id':
      if (param.node.type === 'array') return 'Document IDs'
      return param.node.type === 'union' ? 'Document ID, or a list of them' : 'Document ID'
    case 'datetime':
      return 'ISO 8601 date and time'
    case 'document-type':
    case undefined:
      return undefined
    default:
      param.type.format satisfies never
      return undefined
  }
}

/** The params as one object type, for finding the schema types they reference */
function paramsNode(params: InferredParam[]): TypeNode {
  const attributes: Record<string, ObjectAttribute> = Object.create(null)
  for (const param of params) {
    attributes[param.name] = {type: 'objectAttribute', value: printedNode(param)}
  }
  return {type: 'object', attributes}
}

function printProperty(comment: string | undefined, line: string): string {
  return comment ? `${indent(1)}/** ${comment} */\n${line}` : line
}

/**
 * Prints the params a query uses as an exported TypeScript type, with the printer the result's
 * export uses. Every param is required, since the API rejects a query that references a param
 * it was not sent; one the query tolerates as null takes `null`, which is what to send instead.
 */
export function printParamsTypeScript(
  params: InferredParam[],
  options: PrintParamsOptions,
): string {
  if (params.length === 0) return `export type ${options.typeName} = Record<string, never>;`
  return printTypeScript(paramsNode(params), {...options, jsonValues: true}, (print) => {
    const properties = params.map((param) => {
      const node = printedNode(param)
      const type =
        param.nullable && node.type !== 'unknown'
          ? {type: 'union' as const, of: [node, {type: 'null' as const}]}
          : node
      const line = `${indent(1)}${joinKeyAndValue(printTypeKey(param.name), print(type, 1))};`
      return printProperty(printComment(param), line)
    })
    return `{\n${properties.join('\n')}\n}`
  })
}

/** What the query checks of a value that its type does not say */
function printRefinements(param: InferredParam, node: TypeNode): string {
  if (param.node.type === 'unknown') return ''
  if (param.type.kind === 'integer' && isPlain(node, 'number')) return '.int()'
  if (param.type.format === 'datetime' && isPlain(node, 'string'))
    return '.datetime({offset: true})'
  return ''
}

/**
 * Prints the params a query uses as a Zod object schema with the printer the result's export
 * uses, followed by the type inferred from it. A param the query tolerates as null defaults to
 * it: the API rejects a query that references a param it was not sent, but accepts `null`.
 */
export function printParamsZod(params: InferredParam[], options: PrintParamsOptions): string {
  return printZod(paramsNode(params), options, (print) => {
    if (params.length === 0) return 'z.object({})'
    const properties = params.map((param) => {
      const node = printedNode(param)
      const nullable = param.nullable && node.type !== 'unknown' ? '.nullable().default(null)' : ''
      const value = `${print(node, 1)}${printRefinements(param, node)}${nullable}`
      const line = `${indent(1)}${joinKeyAndValue(printLiteralKey(param.name), value)},`
      return printProperty(printComment(param), line)
    })
    return `z.object({\n${properties.join('\n')}\n})`
  })
}
