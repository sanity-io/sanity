import {type ExprNode, parse, type SchemaType, typeEvaluate, type TypeNode, unparse} from 'groq-js'

/** What a param's value is, as far as the query (and the schema) tell */
export type ParamKind = 'string' | 'number' | 'integer' | 'boolean' | 'any'

/** What the strings of a `string` param stand for, for the hint and the input helpers */
export type ParamFormat = 'document-type' | 'document-id' | 'datetime'

export interface ParamType {
  kind: ParamKind
  /** The param holds a list of `kind` values (`_type in $types`) */
  array: boolean
  /** The values the schema allows, offered as suggestions; others can still be entered */
  options?: string[]
  format?: ParamFormat
}

export interface InferredParam {
  name: string
  type: ParamType
  /** The expressions that use the param, as GROQ */
  usages: string[]
}

export interface ParamInference {
  /** In the order the query first mentions them */
  params: InferredParam[]
  /** The query does not parse: its params are found in its text, without types */
  syntaxError: boolean
}

export interface InferParamsOptions {
  /** The workspace schema in groq-js form; without it the types come from the query alone */
  schema?: SchemaType
  /** The workspace's document type names, suggested for `_type == $param` without a schema */
  documentTypes?: string[]
}

const ANY: ParamType = {kind: 'any', array: false}
const INTEGER: ParamType = {kind: 'integer', array: false}
const IDENTIFIER_START = /[A-Za-z_]/
const IDENTIFIER_PART = /[A-Za-z0-9_]/

/** The `$name`s in a query's text, outside string literals and comments, in order */
export function findParamNames(query: string): string[] {
  const names = new Set<string>()
  let index = 0
  while (index < query.length) {
    const char = query[index]
    if (char === '"' || char === "'") {
      index++
      while (index < query.length && query[index] !== char) {
        index += query[index] === '\\' ? 2 : 1
      }
      index++
    } else if (char === '/' && query[index + 1] === '/') {
      const lineEnd = query.indexOf('\n', index)
      index = lineEnd === -1 ? query.length : lineEnd
    } else if (char === '$' && IDENTIFIER_START.test(query[index + 1] ?? '')) {
      let end = index + 2
      while (end < query.length && IDENTIFIER_PART.test(query[end])) end++
      names.add(query.slice(index + 1, end))
      index = end
    } else {
      index++
    }
  }
  return [...names]
}

// groq-js evaluates slice bounds while parsing, so a query with `[0...$limit]` only parses with
// params; given ones replace their `Parameter` nodes with these numbers, which the slices keep
const SENTINEL_BASE = 2 ** 42

function sentinelParams(names: Iterable<string>): Record<string, number> {
  const params: Record<string, number> = {}
  let index = 0
  for (const name of names) params[name] = SENTINEL_BASE + index++
  return params
}

function isNode(value: unknown): value is ExprNode {
  return (
    typeof value === 'object' && value !== null && typeof Reflect.get(value, 'type') === 'string'
  )
}

function forEachChild(node: ExprNode, visit: (child: ExprNode) => void) {
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) {
      for (const item of value) if (isNode(item)) visit(item)
    } else if (isNode(value)) {
      visit(value)
    }
  }
}

function forEachNode(node: ExprNode, visit: (node: ExprNode) => void) {
  visit(node)
  forEachChild(node, (child) => forEachNode(child, visit))
}

function boundText(bound: number, sentinels: Map<number, string>): string {
  const name = sentinels.get(bound)
  return name === undefined ? String(bound) : `$${name}`
}

/** Params used as slice bounds, with the slice written out (the params are numbers in the AST) */
function findSliceParams(query: string, names: string[]): Map<string, string> {
  const slices = new Map<string, string>()
  const params = sentinelParams(names)
  const sentinels = new Map(Object.entries(params).map(([name, value]) => [value, name]))
  let ast: ExprNode
  try {
    ast = parse(query, {params})
  } catch {
    return slices
  }
  forEachNode(ast, (node) => {
    if (node.type !== 'Slice') return
    const text = `[${boundText(node.left, sentinels)}${node.isInclusive ? '..' : '...'}${boundText(node.right, sentinels)}]`
    for (const bound of [node.left, node.right]) {
      const name = sentinels.get(bound)
      if (name !== undefined && !slices.has(name)) slices.set(name, text)
    }
  })
  return slices
}

/** Where `@` points while an expression is evaluated */
interface Scope {
  /** An expression for the array whose elements `@` stands for; none at the top level */
  elements: ExprNode | undefined
  /** Those elements are documents (`*`, filtered, ordered or sliced) */
  documents: boolean
}

const ROOT_SCOPE: Scope = {elements: undefined, documents: false}

function isDocuments(node: ExprNode): boolean {
  switch (node.type) {
    case 'Everything':
      return true
    case 'Filter':
    case 'Slice':
    case 'PipeFuncCall':
    case 'Group':
      return isDocuments(node.base)
    default:
      return false
  }
}

/** How the param relates to the expression next to it */
type Relation =
  /** `operand == $param`, `operand > $param`, `operand + $param` */
  | 'value'
  /** `$param in operand` */
  | 'element'
  /** `operand in $param` */
  | 'list'

interface Usage {
  name: string
  text: string
  type: ParamType | undefined
}

const COMPARISONS = new Set(['==', '!=', '<', '<=', '>', '>=', '+', '-', '*', '/', '%', '**'])

const FUNCTION_ARGUMENTS: Record<string, ParamType> = {
  'global::references': {kind: 'string', array: false, format: 'document-id'},
  'global::dateTime': {kind: 'string', array: false, format: 'datetime'},
  'global::lower': {kind: 'string', array: false},
  'global::upper': {kind: 'string', array: false},
  'global::path': {kind: 'string', array: false},
  'global::round': {kind: 'number', array: false},
  'string::startsWith': {kind: 'string', array: false},
  'string::split': {kind: 'string', array: false},
}

function describe(node: ExprNode, fallback: string): string {
  try {
    return unparse(node).replaceAll('global::', '')
  } catch {
    return fallback
  }
}

function withoutNull(node: TypeNode): TypeNode[] {
  if (node.type === 'union') return node.of.flatMap(withoutNull)
  return node.type === 'null' ? [] : [node]
}

/** The type of the elements of an array type (or of a union of array types) */
function elementType(node: TypeNode): TypeNode {
  const members = withoutNull(node).map((member) =>
    member.type === 'array' ? member.of : {type: 'unknown' as const},
  )
  if (members.length === 1) return members[0]
  return members.length === 0 ? {type: 'unknown'} : {type: 'union', of: members}
}

/** The param type for a value of `node`'s type, when it is one a form can offer */
function fromTypeNode(node: TypeNode): ParamType | undefined {
  const members = withoutNull(node)
  if (members.length === 0) return undefined
  if (members.every((member) => member.type === 'string')) {
    const values = members.map((member) => (member.type === 'string' ? member.value : undefined))
    const options = values.every((value) => value !== undefined)
      ? [...new Set(values)].toSorted()
      : undefined
    return {kind: 'string', array: false, options}
  }
  if (members.every((member) => member.type === 'number')) return {kind: 'number', array: false}
  if (members.every((member) => member.type === 'boolean')) return {kind: 'boolean', array: false}
  if (members.length === 1 && members[0].type === 'array') {
    const element = fromTypeNode(members[0].of)
    return element && !element.array ? {...element, array: true} : undefined
  }
  return undefined
}

function fromSchema(
  relation: Relation,
  operand: ExprNode,
  scope: Scope,
  schema: SchemaType,
): ParamType | undefined {
  let node: TypeNode
  try {
    node = scope.elements
      ? elementType(typeEvaluate({type: 'Map', base: scope.elements, expr: operand}, schema))
      : typeEvaluate(operand, schema)
  } catch {
    return undefined
  }
  if (relation === 'element') return fromTypeNode(elementType(node))
  const type = fromTypeNode(node)
  if (relation === 'list') return type && !type.array ? {...type, array: true} : undefined
  return type
}

/** What the expression next to a param says about it, without a schema */
function fromQuery(
  operand: ExprNode,
  scope: Scope,
  documentTypes: string[],
): ParamType | undefined {
  switch (operand.type) {
    case 'AccessAttribute': {
      const own = !operand.base || operand.base.type === 'This'
      if (operand.name === '_type' && own) {
        return scope.documents && documentTypes.length > 0
          ? {kind: 'string', array: false, options: documentTypes, format: 'document-type'}
          : {kind: 'string', array: false}
      }
      if (operand.name === '_ref' || (operand.name === '_id' && own)) {
        return {kind: 'string', array: false, format: 'document-id'}
      }
      if ((operand.name === '_createdAt' || operand.name === '_updatedAt') && own) {
        return {kind: 'string', array: false, format: 'datetime'}
      }
      if ((operand.name === '_rev' || operand.name === '_key') && own) {
        return {kind: 'string', array: false}
      }
      return undefined
    }
    case 'FuncCall': {
      const name = `${operand.namespace}::${operand.name}`
      if (name === 'global::count' || name === 'global::length')
        return {kind: 'number', array: false}
      if (name === 'global::dateTime' || name === 'global::now') {
        return {kind: 'string', array: false, format: 'datetime'}
      }
      if (name === 'global::lower' || name === 'global::upper')
        return {kind: 'string', array: false}
      return undefined
    }
    case 'Value':
      if (typeof operand.value === 'string') return {kind: 'string', array: false}
      if (typeof operand.value === 'number') return {kind: 'number', array: false}
      if (typeof operand.value === 'boolean') return {kind: 'boolean', array: false}
      return undefined
    default:
      return undefined
  }
}

function resolve(
  relation: Relation,
  operand: ExprNode,
  scope: Scope,
  options: InferParamsOptions,
): ParamType | undefined {
  const queried = fromQuery(operand, scope, options.documentTypes ?? [])
  let heuristic: ParamType | undefined
  if (relation === 'value') {
    heuristic = queried
  } else if (relation === 'list' && queried && !queried.array) {
    heuristic = {...queried, array: true}
  }
  const schematic = options.schema
    ? fromSchema(relation, operand, scope, options.schema)
    : undefined
  if (!schematic) return heuristic
  // The schema knows the values; the query still tells what they are (a date, a document type)
  return heuristic && heuristic.kind === schematic.kind
    ? {...schematic, format: heuristic.format}
    : schematic
}

function collectUsages(ast: ExprNode, options: InferParamsOptions): Usage[] {
  const usages: Usage[] = []
  const handled = new Set<ExprNode>()

  const report = (param: ExprNode, context: ExprNode, type: ParamType | undefined) => {
    if (param.type !== 'Parameter') return
    handled.add(param)
    usages.push({name: param.name, text: describe(context, `$${param.name}`), type})
  }

  const inspect = (node: ExprNode, scope: Scope) => {
    switch (node.type) {
      case 'OpCall': {
        const {left, right, op} = node
        if (op === 'in') {
          if (left.type === 'Parameter' && right.type !== 'Parameter') {
            report(left, node, resolve('element', right, scope, options))
          } else if (right.type === 'Parameter' && left.type !== 'Parameter') {
            report(right, node, resolve('list', left, scope, options))
          }
        } else if (op === 'match') {
          const type: ParamType = {kind: 'string', array: false}
          report(left, node, type)
          report(right, node, type)
        } else if (COMPARISONS.has(op)) {
          if (right.type === 'Parameter' && left.type !== 'Parameter') {
            report(right, node, resolve('value', left, scope, options))
          } else if (left.type === 'Parameter' && right.type !== 'Parameter') {
            report(left, node, resolve('value', right, scope, options))
          }
        }
        break
      }
      case 'InRange':
        report(node.left, node, resolve('value', node.base, scope, options))
        report(node.right, node, resolve('value', node.base, scope, options))
        break
      case 'FuncCall': {
        const type = FUNCTION_ARGUMENTS[`${node.namespace}::${node.name}`]
        if (type) for (const arg of node.args) report(arg, node, type)
        break
      }
      case 'And':
      case 'Or':
        report(node.left, node, {kind: 'boolean', array: false})
        report(node.right, node, {kind: 'boolean', array: false})
        break
      case 'Not':
        report(node.base, node, {kind: 'boolean', array: false})
        break
      case 'Select':
        for (const alternative of node.alternatives) {
          report(alternative.condition, node, {kind: 'boolean', array: false})
        }
        break
      default:
        break
    }
  }

  const visit = (node: ExprNode, scope: Scope, parent: ExprNode | undefined) => {
    inspect(node, scope)
    if (node.type === 'Parameter') {
      if (!handled.has(node)) report(node, parent ?? node, undefined)
      return
    }
    switch (node.type) {
      case 'Filter':
        visit(node.base, scope, node)
        visit(node.expr, {elements: node, documents: isDocuments(node.base)}, node)
        return
      case 'Map':
      case 'FlatMap':
        visit(node.base, scope, node)
        visit(node.expr, {elements: node.base, documents: isDocuments(node.base)}, node)
        return
      case 'PipeFuncCall':
        visit(node.base, scope, node)
        for (const arg of node.args) {
          visit(arg, {elements: node.base, documents: isDocuments(node.base)}, node)
        }
        return
      case 'Projection': {
        visit(node.base, scope, node)
        // Inside, `@` is the projected value: per element of the current scope, or on its own
        const projected: Scope =
          node.base.type === 'This'
            ? scope
            : {
                elements: scope.elements
                  ? {type: 'Map', base: scope.elements, expr: node.base}
                  : {
                      type: 'Array',
                      elements: [{type: 'ArrayElement', value: node.base, isSplat: false}],
                    },
                documents: false,
              }
        visit(node.expr, projected, node)
        return
      }
      default:
        forEachChild(node, (child) => visit(child, scope, node))
    }
  }

  visit(ast, ROOT_SCOPE, undefined)
  return usages
}

/** One type for a param from all its usages: the first known kind, with the others' suggestions */
function mergeTypes(types: ParamType[]): ParamType {
  const known = types.filter((type) => type.kind !== 'any')
  if (known.length === 0) return ANY
  const [first] = known
  const same = known.filter((type) => type.kind === first.kind && type.array === first.array)
  const optionLists = same.flatMap((type) => (type.options ? [type.options] : []))
  const options = optionLists.length > 0 ? [...new Set(optionLists.flat())].toSorted() : undefined
  const format = same.find((type) => type.format)?.format
  return {kind: first.kind, array: first.array, ...(options && {options}), ...(format && {format})}
}

/**
 * Finds the params a GROQ query uses and what each one is expected to hold, from how the query
 * uses it (`_type == $type`, `[0...$limit]`, `references($id)`, `$tag in tags[]`) and, given the
 * workspace schema, from the type of the expression it is compared with (typegen's evaluation).
 */
export function inferQueryParams(query: string, options: InferParamsOptions = {}): ParamInference {
  const names = findParamNames(query)
  if (names.length === 0) return {params: [], syntaxError: false}

  const slices = findSliceParams(query, names)
  let ast: ExprNode
  try {
    ast = parse(query, {params: sentinelParams(slices.keys())})
  } catch {
    return {
      params: names.map((name) => {
        const slice = slices.get(name)
        return {name, type: slice ? INTEGER : ANY, usages: slice ? [slice] : []}
      }),
      syntaxError: true,
    }
  }

  const usages = collectUsages(ast, options)
  return {
    params: names.map((name) => {
      const own = usages.filter((usage) => usage.name === name)
      const slice = slices.get(name)
      const types = own.flatMap((usage) => (usage.type ? [usage.type] : []))
      return {
        name,
        type: slice ? INTEGER : mergeTypes(types),
        usages: [...new Set([...(slice ? [slice] : []), ...own.map((usage) => usage.text)])],
      }
    }),
    syntaxError: false,
  }
}
