import {
  type ExprNode,
  type FuncCallNode,
  type InRangeNode,
  type ObjectAttribute,
  type ObjectNode,
  type OpCall,
  type OpCallNode,
  type ParameterNode,
  parse,
  type SchemaType,
  typeEvaluate,
  type TypeNode,
  unparse,
} from 'groq-js'

import {isPlainObject} from '../../util/isPlainObject'
import {parseGroq, readQueryFunctions} from './groqFunctions'
import {inferTypeFromValue} from './typegen/inferTypeFromValue'

/** What a param's value is, as far as the query (and the schema) tell */
export type ParamKind = 'string' | 'number' | 'integer' | 'boolean' | 'any'

/** What the strings of a `string` param stand for, for the hint and the input helpers */
export type ParamFormat = 'document-type' | 'document-id' | 'datetime'

/** A param's type as the params form offers it */
export interface ParamType {
  kind: ParamKind
  /** The param holds a list of `kind` values (`_type in $types`) */
  array: boolean
  /** The values the schema allows, offered as suggestions; others can still be entered */
  options?: string[]
  format?: ParamFormat
  /** The smallest number a number input offers, from the query or a field's validation */
  min?: number
  /** The largest number a number input offers */
  max?: number
  /** The step of a number input: `1` for a whole number, or from a field's `precision()` */
  step?: number
}

/**
 * The `min`, `max`, `integer` and `precision` rules of one number field. `{}` is a number field
 * with no rules; a missing field is not represented
 */
export interface NumberRules {
  min?: number
  max?: number
  integer?: boolean
  precision?: number
}

export interface InferredParam {
  name: string
  /**
   * What the query expects the param to hold, without `null` (see `nullable`): `unknown` when
   * nothing in the query constrains it
   */
  node: TypeNode
  /** `node` as the params form offers it */
  type: ParamType
  /** The expressions that use the param, as GROQ */
  usages: string[]
  /** The query expects null too: `defined($param)`, `coalesce($param, …)`, `$param == null`, `!$param || …` */
  nullable?: true
  /** Why `node` is `unknown`, as a clause that completes "could not be inferred because …" */
  reason?: string
  /** `node` is `unknown` and the param has a value: that value's type, for the exports */
  valueNode?: TypeNode
  /** The keys the query reads from the param (`$range.min`), when it holds an object */
  fields?: InferredParam[]
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
  /** The params' current values, typed for a param the query says nothing about */
  values?: Record<string, unknown>
  /**
   * The number rules of a field of a document type, given its path. A param compared with the
   * field, or used as an end of its range, takes the loosest bounds across the types in scope
   */
  numberRules?: (documentType: string, path: string[]) => NumberRules | undefined
}

const ANY: ParamType = {kind: 'any', array: false}
const IDENTIFIER_START = /[A-Za-z_]/
const IDENTIFIER_PART = /[A-Za-z0-9_]/

/**
 * The `$name`s in a query's text, outside string literals and comments, in order. Within a custom
 * function's declaration its own parameter is not one: the function's caller passes it.
 */
export function findParamNames(query: string): string[] {
  const {declarations} = readQueryFunctions(parseGroq(query), query)
  const isFunctionParameter = (name: string, at: number) =>
    declarations.some(
      ({range, parameters}) =>
        at >= range.from &&
        at < range.to &&
        parameters.some((parameter) => parameter.name === `$${name}`),
    )
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
      const name = query.slice(index + 1, end)
      if (!isFunctionParameter(name, index)) names.add(name)
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

/**
 * groq-js 2.0 only ends a `//` comment at a newline, so a query whose last line is a comment
 * would not parse; such a query is parsed again with one appended. Any other error is the
 * query's own.
 */
function parseQuery(query: string, params: Record<string, number>): ExprNode {
  try {
    return parse(query, {params})
  } catch (error) {
    try {
      return parse(`${query}\n`, {params})
    } catch {
      throw error
    }
  }
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
    ast = parseQuery(query, params)
  } catch {
    return slices
  }
  const visit = (node: ExprNode) => {
    if (node.type === 'Slice') {
      const text = `[${boundText(node.left, sentinels)}${node.isInclusive ? '..' : '...'}${boundText(node.right, sentinels)}]`
      for (const bound of [node.left, node.right]) {
        const name = sentinels.get(bound)
        if (name !== undefined && !slices.has(name)) slices.set(name, text)
      }
    }
    for (const child of children(node)) visit(child)
  }
  visit(ast)
  return slices
}

// Type nodes

const UNKNOWN: TypeNode = {type: 'unknown'}
const STRING: TypeNode = {type: 'string'}
const NUMBER: TypeNode = {type: 'number'}
const BOOLEAN: TypeNode = {type: 'boolean'}

function members(type: TypeNode): TypeNode[] {
  return type.type === 'union' ? type.of.flatMap((member) => members(member)) : [type]
}

function union(types: TypeNode[]): TypeNode {
  const unique = new Map<string, TypeNode>()
  for (const type of types.flatMap((member) => members(member))) {
    unique.set(JSON.stringify(type), type)
  }
  const of = [...unique.values()]
  return of.length === 1 ? of[0] : {type: 'union', of}
}

function arrayOf(of: TypeNode): TypeNode {
  return {type: 'array', of}
}

/** An object type; a `[type, true]` attribute is optional */
function objectOf(attributes: Record<string, TypeNode | [TypeNode, true]>): TypeNode {
  const entries = Object.entries(attributes).map(([name, value]): [string, ObjectAttribute] =>
    Array.isArray(value)
      ? [name, {type: 'objectAttribute', value: value[0], optional: true}]
      : [name, {type: 'objectAttribute', value}],
  )
  return {type: 'object', attributes: Object.fromEntries(entries)}
}

function withoutNull(type: TypeNode): TypeNode {
  const of = members(type).filter((member) => member.type !== 'null')
  return of.length > 0 ? union(of) : type
}

/** Whether every value of `type` is a string or a list of them, which a string format describes */
function holdsStrings(type: TypeNode): boolean {
  return members(type).every(
    (member) => member.type === 'string' || (member.type === 'array' && holdsStrings(member.of)),
  )
}

function elementOf(type: TypeNode): TypeNode {
  return union(members(type).map((member) => (member.type === 'array' ? member.of : member)))
}

/** A literal's primitive: comparing with `"admin"` takes any string, not only that one */
function widen(type: TypeNode): TypeNode {
  return union(
    members(type).map((member) =>
      member.type === 'string' || member.type === 'number' || member.type === 'boolean'
        ? {type: member.type}
        : member,
    ),
  )
}

function sameType(a: TypeNode, b: TypeNode): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

/** The values two types share, or `undefined` when they share none */
function intersect(a: TypeNode, b: TypeNode): TypeNode | undefined {
  if (a.type === 'unknown') return b
  if (b.type === 'unknown') return a
  const shared = members(a).flatMap((x) =>
    members(b).flatMap((y) => {
      const met = meet(x, y)
      return met ? [met] : []
    }),
  )
  return shared.length > 0 ? union(shared) : undefined
}

function meet(x: TypeNode, y: TypeNode): TypeNode | undefined {
  switch (x.type) {
    case 'string':
      if (y.type !== 'string') return undefined
      return literalMeet(x.value, y.value, x, y)
    case 'number':
      if (y.type !== 'number') return undefined
      return literalMeet(x.value, y.value, x, y)
    case 'boolean':
      if (y.type !== 'boolean') return undefined
      return literalMeet(x.value, y.value, x, y)
    case 'array': {
      if (y.type !== 'array') return undefined
      const of = intersect(x.of, y.of)
      return of ? arrayOf(of) : undefined
    }
    default:
      return sameType(x, y) ? x : undefined
  }
}

/** A literal is the narrower of a literal and its primitive; two literals meet when equal */
function literalMeet<T>(
  a: T | undefined,
  b: T | undefined,
  x: TypeNode,
  y: TypeNode,
): TypeNode | undefined {
  if (a === undefined) return y
  if (b === undefined || a === b) return x
  return undefined
}

// What positions take

/** What a position in the query takes: a type, and what its strings or numbers stand for */
interface Expected {
  node: TypeNode
  format?: ParamFormat
  integer?: true
  min?: number
  max?: number
  step?: number
}

const TEXT: Expected = {node: STRING}
const NUMERIC: Expected = {node: NUMBER}
const INTEGER: Expected = {node: NUMBER, integer: true}
/** `count()` and `length()` are whole numbers from 0 */
const COUNT: Expected = {node: NUMBER, integer: true, min: 0}
const CONDITION: Expected = {node: BOOLEAN}
const DATETIME: Expected = {node: STRING, format: 'datetime'}
const DOCUMENT_ID: Expected = {node: STRING, format: 'document-id'}
const ANY_ARRAY: Expected = {node: arrayOf(UNKNOWN)}
/** A filter given a param, `*[$index]`, picks an element by number or keeps all by boolean */
const FILTER_PARAM: Expected = {node: union([NUMBER, BOOLEAN])}
/** A param dereferenced with `->` holds a reference */
const REFERENCE: Expected = {node: objectOf({_ref: STRING})}

/** A Portable Text block, as far as `pt::text()` reads one */
const BLOCK = objectOf({
  _type: STRING,
  children: arrayOf(objectOf({_type: STRING, text: [STRING, true]})),
})
/** A point (a `geopoint` value, `geo::latLng()`) or a GeoJSON geometry */
const GEO: Expected = {
  node: union([
    objectOf({lat: NUMBER, lng: NUMBER, alt: [NUMBER, true]}),
    objectOf({type: STRING, coordinates: arrayOf(UNKNOWN)}),
  ]),
}

interface Signature {
  args: Expected[]
  /** What the arguments past `args` take */
  rest?: Expected
  /** Whether the arguments hold the same type, so a param takes the type of the others */
  alike?: true
}

/**
 * What the arguments of GROQ's functions take, by `namespace::name` (groq-js's function registry).
 * `coalesce()` and `defined()` are read separately; a function that is not here takes any value
 * (`diff::*` and `delta::*` take selectors, `documents::*` and `user::*` anything).
 */
const SIGNATURES: Record<string, Signature> = {
  'global::boost': {args: [CONDITION, NUMERIC]},
  'global::count': {args: [ANY_ARRAY]},
  'global::dateTime': {args: [DATETIME]},
  'global::length': {args: [{node: union([STRING, arrayOf(UNKNOWN)])}]},
  'global::lower': {args: [TEXT]},
  'global::path': {args: [TEXT]},
  'global::references': {
    args: [],
    rest: {node: union([STRING, arrayOf(STRING)]), format: 'document-id'},
  },
  'global::round': {args: [NUMERIC, {...INTEGER, min: 0}]},
  'global::string': {args: [{node: union([STRING, NUMBER, BOOLEAN])}]},
  'global::upper': {args: [TEXT]},
  'string::lower': {args: [TEXT]},
  'string::split': {args: [TEXT, TEXT]},
  'string::startsWith': {args: [TEXT, TEXT]},
  'string::upper': {args: [TEXT]},
  'array::compact': {args: [ANY_ARRAY]},
  'array::intersects': {args: [ANY_ARRAY, ANY_ARRAY], alike: true},
  'array::join': {args: [{node: arrayOf(union([STRING, NUMBER, BOOLEAN]))}, TEXT]},
  'array::unique': {args: [ANY_ARRAY]},
  'geo::contains': {args: [GEO, GEO]},
  'geo::distance': {args: [GEO, GEO]},
  'geo::intersects': {args: [GEO, GEO]},
  'geo::latLng': {args: [NUMERIC, NUMERIC]},
  'math::avg': {args: [{node: arrayOf(NUMBER)}]},
  'math::max': {args: [{node: arrayOf(NUMBER)}]},
  'math::min': {args: [{node: arrayOf(NUMBER)}]},
  'math::sum': {args: [{node: arrayOf(NUMBER)}]},
  'media::aspect': {args: [{node: UNKNOWN}, TEXT]},
  'pt::text': {args: [{node: union([BLOCK, arrayOf(BLOCK)])}]},
  'sanity::partOfRelease': {args: [TEXT]},
  'sanity::versionOf': {args: [DOCUMENT_ID]},
  'text::query': {args: [TEXT]},
  'text::semanticSimilarity': {args: [TEXT]},
}

/**
 * What functions return, for comparing with one groq-js cannot type without knowing its argument
 * (`count(tags) > $min` without the schema), and for the format of a date and time
 */
const RETURNS: Record<string, Expected> = {
  'global::count': COUNT,
  'global::dateTime': DATETIME,
  'global::length': COUNT,
  'global::lower': TEXT,
  'global::now': DATETIME,
  'global::round': NUMERIC,
  'global::string': TEXT,
  'global::upper': TEXT,
  'string::lower': TEXT,
  'string::upper': TEXT,
  'dateTime::now': DATETIME,
  'geo::distance': NUMERIC,
  'math::avg': NUMERIC,
  'math::max': NUMERIC,
  'math::min': NUMERIC,
  'math::sum': NUMERIC,
  'pt::text': TEXT,
}

// Reading the query

/**
 * Where an expression is evaluated, as in groq-content-mapper's `inferParams`. `wrap` turns an
 * expression meant for this scope into a root-level query whose result holds the expression's
 * type `depth` probe objects deep: each scope-creating ancestor keeps its base and swaps its body
 * for a projection of the probe, so groq-js resolves the scope exactly as it does for the query.
 */
interface Scope {
  depth: number
  wrap: (expr: ExprNode) => ExprNode
  /** `@` is a document: an element of `*`, filtered, ordered or sliced */
  documents: boolean
}

/** The attribute a probe projection writes the counterpart's type to */
const PROBE = '__visionParamProbe'
const ROOT: Scope = {depth: 0, wrap: (expr) => expr, documents: false}

function nested(scope: Scope, build: (probe: ObjectNode) => ExprNode, documents: boolean): Scope {
  return {
    depth: scope.depth + 1,
    wrap: (expr) =>
      scope.wrap(
        build({
          type: 'Object',
          attributes: [{type: 'ObjectAttributeValue', name: PROBE, value: expr}],
        }),
      ),
    documents,
  }
}

/** The probe evaluated once per element of `base`, whether the elements are objects or not */
function mapElements(base: ExprNode, probe: ObjectNode): ExprNode {
  return {type: 'Map', base, expr: ownScope(probe)}
}

/**
 * groq-js hides a map's scope from `^`, so a probe that uses `^` projects `@` to get a scope of
 * its own, as a filter or `@{...}` has. That types only object elements, so other probes do not.
 */
function ownScope(probe: ObjectNode): ExprNode {
  if (!some(probe, (node) => node.type === 'Parent')) return probe
  return {type: 'Projection', base: {type: 'This'}, expr: probe}
}

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

/** A param on one side of an operator, with the expression on the other side */
interface Comparison {
  counterpart: ExprNode
  /** `same` holds what the counterpart holds: an alternative of `coalesce()` */
  op: OpCall | 'range' | 'same'
  paramOnLeft: boolean
  scope: Scope
}

/** One use of a param, and what it says about the param's type */
interface Occurrence {
  name: string
  /** The keys read from the param, outermost first: `["a", "b"]` for `$p.a.b` */
  path: string[]
  usage: string
  expected?: Expected
  /** Typed once the comparison's counterpart is evaluated against the schema */
  comparison?: Comparison
  nullable?: boolean
  /** Why this use says nothing about the type */
  reason?: string
}

const RETURNED = 'the query only returns it'
const CHECKED = 'the query only checks whether it is set'
const ORDERED = 'it is only used to order by'
const ARITHMETIC = new Set<OpCall>(['-', '*', '/', '%', '**'])
/** A param compared this way with a field can take that field's validation bounds */
const ORDERINGS = new Set<OpCall>(['==', '!=', '<', '<=', '>', '>='])
/** Nodes that hold a param without using it, so its usage is the param alone */
const CONTAINERS = new Set<ExprNode['type']>(['Array', 'Object', 'Projection', 'Select'])

/** The param a node reads, and the keys it reads from it: `$p` or `$p.a.b` */
function paramPath(node: ExprNode): {param: ParameterNode; path: string[]} | undefined {
  const inner = unwrapGroups(node)
  if (inner.type === 'Parameter') return {param: inner, path: []}
  if (inner.type !== 'AccessAttribute' || !inner.base) return undefined
  const base = paramPath(inner.base)
  return base && {param: base.param, path: [...base.path, inner.name]}
}

/** The param a node reads, whole or one of its keys */
function asParameter(node: ExprNode): ParameterNode | undefined {
  return paramPath(node)?.param
}

function pathText({param, path}: {param: ParameterNode; path: string[]}): string {
  return `$${[param.name, ...path].join('.')}`
}

function unwrapGroups(node: ExprNode): ExprNode {
  return node.type === 'Group' ? unwrapGroups(node.base) : node
}

function isNull(node: ExprNode): boolean {
  const inner = unwrapGroups(node)
  return inner.type === 'Value' && inner.value === null
}

function describe(node: ExprNode, fallback: string): string {
  try {
    return unparse(node).replaceAll('global::', '')
  } catch {
    return fallback
  }
}

function functionName(node: {namespace: string; name: string}): string {
  return node.namespace === 'global' ? node.name : `${node.namespace}::${node.name}`
}

/** Why a param that nothing types is there, from the expression it sits in */
function unconstrainedReason(param: ParameterNode, parent: ExprNode | undefined): string {
  if (!parent) return RETURNED
  switch (parent.type) {
    case 'Array':
    case 'Map':
    case 'FlatMap':
    case 'Object':
    case 'Projection':
    case 'Select':
    case 'Tuple':
      return RETURNED
    case 'OpCall': {
      const other = asParameter(parent.left) === param ? parent.right : parent.left
      const otherParam = asParameter(other)
      return otherParam
        ? `it is only compared with \`$${otherParam.name}\`, which is not typed either`
        : `\`${describe(parent, `$${param.name}`)}\` does not constrain it`
    }
    case 'FuncCall':
      return `\`${functionName(parent)}()\` takes any value`
    case 'PipeFuncCall':
    case 'Asc':
    case 'Desc':
      return ORDERED
    default:
      return `\`${describe(parent, `$${param.name}`)}\` does not constrain it`
  }
}

/** Every use of a param in the query, as content-mapper's `walk` finds comparisons */
function collect(ast: ExprNode): Occurrence[] {
  const occurrences: Occurrence[] = []
  const typed = new Set<ExprNode>()
  const guards = new Set<ExprNode>()

  const note = (
    node: ExprNode,
    context: ExprNode | string,
    occurrence: Omit<Occurrence, 'name' | 'path' | 'usage'>,
  ) => {
    const reference = paramPath(node)
    if (!reference) return
    typed.add(reference.param)
    occurrences.push({
      name: reference.param.name,
      path: reference.path,
      usage: typeof context === 'string' ? context : describe(context, pathText(reference)),
      ...occurrence,
    })
  }

  /** `node` is passed where `expected` is taken: types the params it is made of */
  const expect = (node: ExprNode, expected: Expected, context: ExprNode) => {
    const inner = unwrapGroups(node)
    if (asParameter(inner)) {
      note(inner, context, {expected})
      return
    }
    switch (inner.type) {
      case 'OpCall':
        // `$a + $b` adds what is expected; `$a * $b` multiplies numbers
        if (inner.op === '+') {
          expect(inner.left, expected, context)
          expect(inner.right, expected, context)
        } else if (ARITHMETIC.has(inner.op)) {
          expect(inner.left, NUMERIC, context)
          expect(inner.right, NUMERIC, context)
        }
        return
      case 'FuncCall':
        if (inner.namespace === 'global' && inner.name === 'coalesce') {
          const last = inner.args.length - 1
          inner.args.forEach((arg, index) => {
            if (asParameter(arg)) note(arg, inner, {expected, nullable: index < last})
          })
        }
        return
      case 'Select':
        for (const alternative of inner.alternatives) {
          expect(alternative.value, expected, context)
        }
        if (inner.fallback) expect(inner.fallback, expected, context)
        return
      default:
        return
    }
  }

  const noteOpCall = (node: OpCallNode, scope: Scope) => {
    const left = asParameter(node.left)
    const right = asParameter(node.right)
    // Two params say nothing about each other, and two fields involve no param
    if (Boolean(left) === Boolean(right)) {
      if (left && right && ARITHMETIC.has(node.op)) {
        note(node.left, node, {expected: NUMERIC})
        note(node.right, node, {expected: NUMERIC})
      }
      return
    }
    const param = left ? node.left : node.right
    const counterpart = left ? node.right : node.left
    if ((node.op === '==' || node.op === '!=') && isNull(counterpart)) {
      note(param, node, {nullable: true, reason: CHECKED})
    } else if (node.op === 'match') {
      note(param, node, {expected: TEXT})
    } else if (ARITHMETIC.has(node.op)) {
      note(param, node, {expected: NUMERIC})
    } else {
      note(param, node, {comparison: {counterpart, op: node.op, paramOnLeft: Boolean(left), scope}})
    }
  }

  const noteRange = (node: InRangeNode, scope: Scope) => {
    for (const bound of [node.left, node.right]) {
      note(bound, node, {
        comparison: {counterpart: node.base, op: 'range', paramOnLeft: true, scope},
      })
    }
    // `$value in 1..10` takes what the bounds are
    const bound = [node.left, node.right].find((candidate) => !asParameter(candidate))
    if (bound) {
      note(node.base, node, {comparison: {counterpart: bound, op: '==', paramOnLeft: true, scope}})
    }
  }

  const noteFuncCall = (node: FuncCallNode, scope: Scope) => {
    const name = `${node.namespace}::${node.name}`
    if (name === 'global::defined') {
      for (const arg of node.args) note(arg, node, {nullable: true, reason: CHECKED})
      return
    }
    if (name === 'global::coalesce') {
      // A param given as one of the alternatives holds what the others do, or null
      const others = node.args.filter((arg) => !asParameter(arg))
      const last = node.args.length - 1
      node.args.forEach((arg, index) => {
        if (!asParameter(arg)) return
        const nullable = index < last
        if (others.length === 0) {
          note(arg, node, {nullable, reason: `\`${functionName(node)}()\` takes any value`})
        }
        for (const other of others) {
          note(arg, node, {
            nullable,
            comparison: {counterpart: other, op: 'same', paramOnLeft: true, scope},
          })
        }
      })
      return
    }
    const signature = SIGNATURES[name]
    node.args.forEach((arg, index) => {
      const expected = signature && (signature.args[index] ?? signature.rest)
      if (expected && expected.node.type !== 'unknown') expect(arg, expected, node)
    })
    if (!signature?.alike) return
    const others = node.args.filter((arg) => !asParameter(arg))
    for (const arg of node.args) {
      if (!asParameter(arg)) continue
      for (const other of others) {
        note(arg, node, {comparison: {counterpart: other, op: 'same', paramOnLeft: true, scope}})
      }
    }
  }

  const walk = (node: ExprNode, scope: Scope, parent: ExprNode | undefined): void => {
    switch (node.type) {
      case 'Filter': {
        walk(node.base, scope, node)
        // The probe projects the filtered set, so `_type` checks in the filter narrow it
        const inner = nested(scope, (probe) => mapElements(node, probe), isDocuments(node.base))
        const index = paramPath(node.expr)
        if (index) note(node.expr, `[${pathText(index)}]`, {expected: FILTER_PARAM})
        walk(node.expr, inner, node)
        return
      }
      case 'FlatMap':
      case 'Map': {
        walk(node.base, scope, node)
        // `base[]{...}` parses as a map of `@{...}`, the scope `^` resolves from
        const projects = node.expr.type === 'Projection' && node.expr.base.type === 'This'
        const inner = nested(
          scope,
          (probe) => ({...node, expr: projects ? ownScope(probe) : probe}),
          isDocuments(node.base),
        )
        walk(node.expr, inner, node)
        return
      }
      case 'PipeFuncCall': {
        // `order()` and `score()` evaluate their arguments once per element of the base
        walk(node.base, scope, node)
        const inner = nested(
          scope,
          (probe) => mapElements(node.base, probe),
          isDocuments(node.base),
        )
        for (const arg of node.args) {
          if (node.name === 'score') expect(arg, CONDITION, node)
          walk(arg, inner, node)
        }
        return
      }
      case 'Projection': {
        walk(node.base, scope, node)
        // `base{...}` over a set parses as a map of `@{...}`, which keeps the element as `@`
        const inner =
          node.base.type === 'This'
            ? scope
            : nested(scope, (probe) => ({...node, expr: probe}), false)
        walk(node.expr, inner, node)
        return
      }
      case 'Parameter':
      case 'AccessAttribute': {
        const reference = paramPath(node)
        if (!reference) break
        if (!typed.has(reference.param)) {
          const text = pathText(reference)
          occurrences.push({
            name: reference.param.name,
            path: reference.path,
            usage: parent && !CONTAINERS.has(parent.type) ? describe(parent, text) : text,
            reason: unconstrainedReason(reference.param, parent),
          })
        }
        return
      }
      case 'OpCall':
        noteOpCall(node, scope)
        break
      case 'InRange':
        noteRange(node, scope)
        break
      case 'FuncCall':
        noteFuncCall(node, scope)
        break
      case 'And':
      case 'Or': {
        // `!$param || …` skips the rest when the param is not given: it is optional, not a boolean
        const left = unwrapGroups(node.left)
        if (node.type === 'Or' && left.type === 'Not' && asParameter(left.base)) {
          guards.add(left)
          note(left.base, left, {nullable: true, reason: CHECKED})
        } else {
          expect(node.left, CONDITION, node)
        }
        expect(node.right, CONDITION, node)
        break
      }
      case 'Not':
        if (!guards.has(node)) expect(node.base, CONDITION, node)
        break
      case 'Neg':
      case 'Pos':
        expect(node.base, NUMERIC, node)
        break
      case 'Deref':
        note(node.base, node, {expected: REFERENCE})
        break
      case 'Select':
        for (const alternative of node.alternatives) {
          expect(alternative.condition, CONDITION, node)
        }
        break
      case 'AccessElement':
      case 'Array':
      case 'ArrayCoerce':
      case 'Asc':
      case 'Context':
      case 'Desc':
      case 'Everything':
      case 'Group':
      case 'Object':
      case 'Parent':
      case 'SelectorFuncCall':
      case 'SelectorNested':
      case 'Slice':
      case 'This':
      case 'Tuple':
      case 'Value':
        break
      default:
        node satisfies never
    }
    for (const child of children(node)) walk(child, scope, node)
  }

  walk(ast, ROOT, undefined)
  return occurrences
}

function some(node: ExprNode, predicate: (node: ExprNode) => boolean): boolean {
  return predicate(node) || children(node).some((child) => some(child, predicate))
}

function children(node: ExprNode): ExprNode[] {
  switch (node.type) {
    case 'AccessAttribute':
      return node.base ? [node.base] : []
    case 'AccessElement':
    case 'ArrayCoerce':
    case 'Asc':
    case 'Deref':
    case 'Desc':
    case 'Group':
    case 'Neg':
    case 'Not':
    case 'Pos':
    case 'Slice':
      return [node.base]
    case 'And':
    case 'OpCall':
    case 'Or':
      return [node.left, node.right]
    case 'Array':
      return node.elements.map((element) => element.value)
    case 'Context':
    case 'Everything':
    case 'Parameter':
    case 'Parent':
    case 'This':
    case 'Value':
      return []
    case 'Filter':
    case 'FlatMap':
    case 'Map':
    case 'Projection':
      return [node.base, node.expr]
    case 'FuncCall':
      return node.args
    case 'InRange':
      return [node.base, node.left, node.right]
    case 'Object':
      return node.attributes.flatMap((attribute) =>
        attribute.type === 'ObjectConditionalSplat'
          ? [attribute.condition, attribute.value]
          : [attribute.value],
      )
    case 'PipeFuncCall':
      return [node.base, ...node.args]
    case 'Select':
      return [
        ...node.alternatives.flatMap((alternative) => [alternative.condition, alternative.value]),
        ...(node.fallback ? [node.fallback] : []),
      ]
    case 'SelectorFuncCall':
      return [node.arg]
    case 'SelectorNested':
      return [node.base, node.nested]
    case 'Tuple':
      return node.members
    default:
      node satisfies never
      return []
  }
}

// Typing the uses

/** Evaluates `expr` in `scope`, or `undefined` when the probe cannot be typed */
function probe(scope: Scope, expr: ExprNode, schema: SchemaType): TypeNode | undefined {
  let evaluated: TypeNode
  try {
    evaluated = typeEvaluate(passParamConditions(scope.wrap(expr)), schema)
  } catch {
    return undefined
  }
  // A filter no document passes leaves nothing to read, the empty union
  const types = dig(evaluated, scope.depth).flatMap((type) => members(type))
  return types.length > 0 ? union(types) : undefined
}

/**
 * groq-js evaluates most conditions on an untyped param to null (`count($ids) > 0`), so a filter
 * that reads one would leave a probe no documents: such a condition lets every element through
 */
function passParamConditions<T>(node: T): T {
  if (Array.isArray(node)) return node.map((item) => passParamConditions(item)) as T
  if (!node || typeof node !== 'object') return node
  const mapped = Object.fromEntries(
    Object.entries(node).map(([key, value]) => [key, passParamConditions(value)]),
  ) as T & ExprNode
  return mapped.type === 'Filter' ? {...mapped, expr: withoutParamConditions(mapped.expr)} : mapped
}

function withoutParamConditions(condition: ExprNode): ExprNode {
  if (!some(condition, (node) => node.type === 'Parameter')) return condition
  switch (condition.type) {
    case 'And':
      return {
        ...condition,
        left: withoutParamConditions(condition.left),
        right: withoutParamConditions(condition.right),
      }
    case 'Group':
      return withoutParamConditions(condition.base)
    default:
      return {type: 'Value', value: true}
  }
}

/** Reads the probe attribute `depth` levels down, through the arrays and unions on the way */
function dig(node: TypeNode, depth: number): TypeNode[] {
  if (depth === 0) return [node]
  switch (node.type) {
    case 'array':
      return dig(node.of, depth)
    case 'boolean':
    case 'inline':
    case 'null':
    case 'number':
    case 'string':
      return []
    case 'object': {
      const attribute = node.attributes[PROBE]
      return attribute ? dig(attribute.value, depth - 1) : []
    }
    case 'union':
      return node.of.flatMap((member) => dig(member, depth))
    case 'unknown':
      return [node]
    default:
      node satisfies never
      return []
  }
}

/**
 * What the query itself says the counterpart holds, schema or not: the system fields' formats,
 * and the document types a `_type` in a set of documents can take
 */
function hint(
  expr: ExprNode,
  scope: Scope,
  documentTypes: string[] | undefined,
): Expected | undefined {
  switch (expr.type) {
    case 'AccessAttribute': {
      const own = !expr.base || expr.base.type === 'This'
      const dereferenced = expr.base?.type === 'Deref'
      if (expr.name === '_type' && own) {
        if (!scope.documents) return TEXT
        return documentTypes && documentTypes.length > 0
          ? {
              node: union(documentTypes.map((value) => ({type: 'string', value}))),
              format: 'document-type',
            }
          : {node: STRING, format: 'document-type'}
      }
      if (expr.name === '_ref' || (expr.name === '_id' && (own || dereferenced))) return DOCUMENT_ID
      if ((expr.name === '_createdAt' || expr.name === '_updatedAt') && (own || dereferenced)) {
        return DATETIME
      }
      if ((expr.name === '_rev' || expr.name === '_key') && own) return TEXT
      return undefined
    }
    case 'Map': {
      // `categories[]._ref` and `*[…]._id` hold what each element's attribute holds
      const element = unwrapGroups(expr.expr)
      if (element.type !== 'AccessAttribute' || element.name === '_type') return undefined
      const hinted = hint(element, scope, documentTypes)
      return hinted && {...hinted, node: arrayOf(hinted.node)}
    }
    case 'FuncCall':
      return RETURNS[`${expr.namespace}::${expr.name}`]
    default:
      return undefined
  }
}

/** What a param compared with `counterpart` holds, or why the query does not say */
function resolveComparison(
  {counterpart, op, paramOnLeft, scope}: Comparison,
  options: InferParamsOptions,
): Expected | string {
  const expr = unwrapGroups(counterpart)
  const text = describe(expr, 'an expression')
  const hinted = hint(expr, scope, options.documentTypes)
  // Without a schema groq-js still types literals, functions and arithmetic; fields are null
  const probed = probe(scope, expr, options.schema ?? [])
  let base: Expected | undefined = hinted
  if (probed && probed.type !== 'unknown') {
    // A comparison with a literal, as in `$role == "admin"`, is about a value of that primitive
    const type = expr.type === 'Value' ? widen(probed) : withoutNull(probed)
    // An attribute the schema does not have evaluates to null, which says nothing about the value
    if (type.type !== 'null' || expr.type === 'Value') {
      // The schema's `_type`s include the asset documents, which the workspace does not list
      const node = (hinted && intersect(hinted.node, type)) ?? type
      const format = hinted?.format && holdsStrings(node) ? hinted.format : undefined
      // The schema types `count()` as a number; the query still says it is a whole number from 0
      base = {
        node,
        ...(format && {format}),
        ...(hinted?.integer && {integer: true as const}),
        ...(hinted?.min !== undefined && {min: hinted.min}),
        ...(hinted?.max !== undefined && {max: hinted.max}),
        ...(hinted?.step !== undefined && {step: hinted.step}),
      }
    }
  }
  if (!base || base.node.type === 'null') {
    return options.schema
      ? `the schema does not type \`${text}\`, which it is compared with`
      : `\`${text}\`, which it is compared with, needs the workspace schema to be typed`
  }
  if (op === 'same') return base
  const compared = op === 'in' && paramOnLeft ? withoutNull(elementOf(base.node)) : base.node
  const node = comparable(compared)
  if (!node) {
    return op === 'in' && paramOnLeft
      ? `GROQ never finds it in \`${text}\`, whose elements are not strings, numbers or booleans`
      : `GROQ never finds it equal to \`${text}\`, which is not a string, number or boolean`
  }
  const typed: Expected = {...base, node: op === 'in' && !paramOnLeft ? arrayOf(node) : node}
  // `+` reaches here too: it is not in the arithmetic set, and an offset still takes no field bounds
  return op === 'range' || ORDERINGS.has(op) ? withNumberBounds(typed, expr, scope, options) : typed
}

/** `field` or `object.field` of the element in scope, as a path */
function attributePath(node: ExprNode): string[] | undefined {
  const path: string[] = []
  let current: ExprNode | undefined = unwrapGroups(node)
  while (current?.type === 'AccessAttribute') {
    path.unshift(current.name)
    current = current.base ? unwrapGroups(current.base) : undefined
  }
  return path.length > 0 && (!current || current.type === 'This') ? path : undefined
}

/**
 * A number param compared with a document field, or used as an end of its range, takes that
 * field's validation bounds. A bound holds only when every matching type that has the field sets
 * one, and then the loosest value, so a number valid for any of those types is not flagged.
 * Arithmetic never asks: a scale or an offset is not constrained by the field it is used with.
 */
function withNumberBounds(
  expected: Expected,
  counterpart: ExprNode,
  scope: Scope,
  options: InferParamsOptions,
): Expected {
  const {schema, numberRules} = options
  if (!schema || !numberRules || !scope.documents) return expected
  const numbers = members(expected.node)
  if (numbers.length === 0 || numbers.some((member) => member.type !== 'number')) return expected
  const path = attributePath(counterpart)
  if (!path) return expected
  const documentTypes = probe(scope, {type: 'AccessAttribute', name: '_type'}, schema)
  if (!documentTypes) return expected
  const names: string[] = []
  for (const member of members(withoutNull(documentTypes))) {
    if (member.type !== 'string' || member.value === undefined) return expected
    names.push(member.value)
  }
  const ruleSets: NumberRules[] = []
  for (const name of names) {
    const rules = numberRules(name, path)
    if (rules) ruleSets.push(rules)
  }
  if (ruleSets.length === 0) return expected
  const loosest = (values: (number | undefined)[], pick: (...picked: number[]) => number) =>
    values.every((value) => value !== undefined) ? pick(...values) : undefined
  const min = loosest(
    ruleSets.map((rules) => rules.min),
    Math.min,
  )
  const max = loosest(
    ruleSets.map((rules) => rules.max),
    Math.max,
  )
  const precision = loosest(
    ruleSets.map((rules) => rules.precision),
    Math.max,
  )
  const integer =
    expected.integer || ruleSets.every((rules) => rules.integer === true || rules.precision === 0)
  return {
    ...expected,
    ...(integer && {integer: true as const}),
    ...(min !== undefined && {min}),
    ...(max !== undefined && {max}),
    ...(!integer && precision !== undefined && {step: 10 ** -precision}),
  }
}

/**
 * The members of `node` a comparison can hold for: GROQ compares strings, numbers and booleans
 * only, so `{"a": 1} == {"a": 1}` and `[1] == [1]` are false
 */
function comparable(node: TypeNode): TypeNode | undefined {
  const kept = members(node).filter(
    (member) =>
      member.type === 'string' ||
      member.type === 'number' ||
      member.type === 'boolean' ||
      member.type === 'unknown',
  )
  return kept.length > 0 ? union(kept) : undefined
}

/**
 * One type for a param from all its uses: what they all accept (`string` and `"a" | "b"` make
 * `"a" | "b"`), or, when they accept nothing in common, any of them
 */
function combine(expectations: Expected[]): Expected | undefined {
  const known = expectations.filter((expected) => expected.node.type !== 'unknown')
  if (known.length === 0) return undefined
  let result = known[0]
  for (const next of known.slice(1)) {
    const node = intersect(result.node, next.node)
    if (!node) {
      const formats = new Set(known.map((expected) => expected.format))
      const [format] = formats
      return {
        node: union(known.map((expected) => expected.node)),
        ...(formats.size === 1 && format && {format}),
      }
    }
    const format = result.format ?? next.format
    const integer = result.integer || next.integer
    // A bound from one use stands, and two bounds take the stricter, so every use accepts it
    const min =
      result.min === undefined
        ? next.min
        : next.min === undefined
          ? result.min
          : Math.max(result.min, next.min)
    const max =
      result.max === undefined
        ? next.max
        : next.max === undefined
          ? result.max
          : Math.min(result.max, next.max)
    const step =
      result.step === undefined
        ? next.step
        : next.step === undefined
          ? result.step
          : Math.max(result.step, next.step)
    result = {
      node,
      ...(format && {format}),
      ...(integer && {integer: true as const}),
      ...(min !== undefined && {min}),
      ...(max !== undefined && {max}),
      ...(step !== undefined && {step}),
    }
  }
  return result
}

/** The form's view of a type: one input kind, a list of them, or free JSON */
function toParamType(expected: Expected | undefined): ParamType {
  if (!expected) return ANY
  const all = members(expected.node)
  const single = all.filter((member) => member.type !== 'array')
  const lists = all.flatMap((member) => (member.type === 'array' ? [member.of] : []))
  if (single.length > 0) {
    const one = union(single)
    // `references()` takes an ID or a list of them: the form offers the single one
    const type = lists.every((list) => sameType(list, one)) ? scalarType(one, expected) : undefined
    return type ?? ANY
  }
  const type = lists.length === 1 ? scalarType(lists[0], expected) : undefined
  return type ? {...type, array: true} : ANY
}

function scalarType(node: TypeNode, expected: Expected): ParamType | undefined {
  const all = members(node)
  if (all.every((member) => member.type === 'string')) {
    const values = all.map((member) => (member.type === 'string' ? member.value : undefined))
    const options = values.every((value) => value !== undefined) ? [...new Set(values)] : undefined
    const {format} = expected
    return {kind: 'string', array: false, ...(options && {options}), ...(format && {format})}
  }
  if (all.every((member) => member.type === 'number')) {
    return {
      kind: expected.integer ? 'integer' : 'number',
      array: false,
      ...(expected.min !== undefined && {min: expected.min}),
      ...(expected.max !== undefined && {max: expected.max}),
      ...(expected.step !== undefined && {step: expected.step}),
    }
  }
  if (all.every((member) => member.type === 'boolean')) return {kind: 'boolean', array: false}
  return undefined
}

/** The type of a value given for a param, unless it is a placeholder (the form starts with `""`) */
function typeOfValue(value: unknown): TypeNode | undefined {
  if (value === undefined || value === null || value === '') return undefined
  const type = inferTypeFromValue(value)
  return type.type === 'unknown' ? undefined : type
}

/**
 * Finds the params a GROQ query uses and what each one is expected to hold. Follows
 * groq-content-mapper's `inferParams`: a param compared with an expression takes that
 * expression's type, which groq-js evaluates in the comparison's own scope (filters narrow by
 * `_type`, `->` dereferences, nested projections resolve `^`). On top of that, a param passed to
 * a GROQ function takes what the function's argument takes, conditions take booleans, arithmetic
 * numbers, slice bounds integers, and the uses of a param that is used more than once are
 * intersected.
 */
export function inferQueryParams(query: string, options: InferParamsOptions = {}): ParamInference {
  const names = findParamNames(query)
  if (names.length === 0) return {params: [], syntaxError: false}

  const slices = findSliceParams(query, names)
  let ast: ExprNode
  try {
    ast = parseQuery(query, sentinelParams(slices.keys()))
  } catch {
    return {
      params: names.map((name) => {
        const slice = slices.get(name)
        if (slice) return {name, node: NUMBER, type: toParamType(INTEGER), usages: [slice]}
        return {name, node: UNKNOWN, type: ANY, usages: [], reason: 'the query does not parse'}
      }),
      syntaxError: true,
    }
  }

  const occurrences = collect(ast)
  return {
    params: names.map((name) =>
      buildParam(
        name,
        occurrences.filter((occurrence) => occurrence.name === name),
        options,
        options.values?.[name],
        slices.get(name),
      ),
    ),
    syntaxError: false,
  }
}

/** A param, or a key of one, from the occurrences that read it; `path` is relative to it */
function buildParam(
  name: string,
  occurrences: Occurrence[],
  options: InferParamsOptions,
  value: unknown,
  slice?: string,
): InferredParam {
  const own = occurrences.filter((occurrence) => occurrence.path.length === 0)
  const keys = [...new Set(occurrences.flatMap((occurrence) => occurrence.path.slice(0, 1)))]
  const fields = keys.map((key) =>
    buildParam(
      key,
      occurrences
        .filter((occurrence) => occurrence.path[0] === key)
        .map((occurrence) => ({...occurrence, path: occurrence.path.slice(1)})),
      options,
      isPlainObject(value) ? value[key] : undefined,
    ),
  )
  const expectations: Expected[] = slice ? [INTEGER] : []
  const reasons: string[] = []
  for (const occurrence of own) {
    if (occurrence.expected) {
      expectations.push(occurrence.expected)
    } else if (occurrence.comparison) {
      const resolved = resolveComparison(occurrence.comparison, options)
      if (typeof resolved === 'string') reasons.push(resolved)
      else expectations.push(resolved)
    } else if (occurrence.reason) {
      reasons.push(occurrence.reason)
    }
  }
  const combined = combine(expectations)
  const nullable = !slice && own.some((occurrence) => occurrence.nullable)
  const usages = [
    ...new Set([...(slice ? [slice] : []), ...occurrences.map((occurrence) => occurrence.usage)]),
  ]
  const shared = {
    name,
    usages,
    ...(nullable && {nullable: true as const}),
    ...(fields.length > 0 && {fields}),
  }
  if (combined) return {...shared, node: combined.node, type: toParamType(combined)}
  // Nothing uses the object whole: it holds the keys the query reads, a missing one reads as null
  if (fields.length > 0) return {...shared, node: objectOfFields(fields), type: ANY}
  // The most telling reason: one about the query's types over "only returns it"
  const reason =
    reasons.find((candidate) => candidate !== RETURNED && candidate !== CHECKED) ??
    reasons[0] ??
    RETURNED
  const valueNode = typeOfValue(value)
  return {...shared, node: UNKNOWN, type: ANY, reason, ...(valueNode && {valueNode})}
}

function objectOfFields(fields: InferredParam[]): TypeNode {
  const attributes: Record<string, ObjectAttribute> = {}
  for (const field of fields) {
    const value = field.node.type === 'unknown' ? (field.valueNode ?? UNKNOWN) : field.node
    attributes[field.name] = {
      type: 'objectAttribute',
      value,
      ...(field.nullable && {optional: true}),
    }
  }
  return {type: 'object', attributes}
}
