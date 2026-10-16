import {type Schema, type SchemaType} from 'sanity'

import {getDocumentTypeNames} from './documentTypes'
import {type GroqNode, type GroqTree, hasSyntaxErrors, textOf} from './groqFunctions'

/**
 * Checks a query against the workspace schema: the document types its `_type` filters name, and
 * the fields it reads from them, through references (`->`), arrays (`[]`) and nested objects,
 * in filters, projections and `order()`. Only what is certain is flagged: a scope whose types
 * the query does not pin down (`*` without a `_type` filter, a parameter, a function's result)
 * is not checked, since documents can hold fields their schema does not declare.
 */

/** What a query's schema checks need: the workspace's document types */
export interface QuerySchema {
  documents: ReadonlyMap<string, SchemaType>
}

export function createQuerySchema(schema: Schema): QuerySchema {
  const documents = new Map<string, SchemaType>()
  for (const name of getDocumentTypeNames(schema)) {
    const type = schema.get(name)
    if (type) documents.set(name, type)
  }
  return {documents}
}

export type SchemaFindingRule = 'unknown-type' | 'unknown-field' | 'not-a-reference'

export interface SchemaFinding {
  rule: SchemaFindingRule
  from: number
  to: number
  message: string
  /** The name that was probably meant, written in place of the range */
  suggestion?: {text: string; from: number; to: number}
}

/** The shape of a value as the schema knows it */
type Shape =
  | {kind: 'unknown'}
  /** A string, number or boolean of this schema type */
  | {kind: 'value'; type: string}
  /**
   * An object of one of these types; documents are objects too. `label` names an inline object
   * type, which the compiled schema just calls `object`, by the field that holds it.
   */
  | {kind: 'object'; types: readonly SchemaType[]; label?: string}
  /** A document whose type the query has not pinned down */
  | {kind: 'documents'}
  /** A reference to a document of one of these types */
  | {kind: 'reference'; types: readonly SchemaType[]}
  | {kind: 'array'; of: Shape}

const UNKNOWN: Shape = {kind: 'unknown'}

/** Every document and object has these, whatever its schema declares */
const SYSTEM_FIELDS = new Set([
  '_id',
  '_type',
  '_rev',
  '_createdAt',
  '_updatedAt',
  '_originalId',
  '_system',
  '_key',
  '_score',
])
const REFERENCE_FIELDS = new Set([
  '_ref',
  '_type',
  '_key',
  '_weak',
  '_strengthenOnPublish',
  '_dataset',
  '_projectId',
])

const POSTFIX = new Set([
  'ArrayTraversal',
  'Filter',
  'Projection',
  'DotAccess',
  'ParentAccess',
  'SelectorAccess',
  'Dereference',
  'DerefAccess',
])
const PRIMARY = new Set([
  'Everything',
  'This',
  'Parent',
  'Parameter',
  'String',
  'Number',
  'True',
  'False',
  'Null',
  'NamespacedCall',
  'FunctionCall',
  'Identifier',
  'ArrayLiteral',
  'ObjectLiteral',
  'ParenExpression',
])
const BRACKETS = new Set(['[', ']', '{', '}', '(', ')'])

function childrenOf(node: GroqNode): GroqNode[] {
  const nodes: GroqNode[] = []
  for (let child = node.firstChild; child; child = child.nextSibling) nodes.push(child)
  return nodes
}

/** The children between a node's brackets */
function innerOf(node: GroqNode): GroqNode[] {
  return childrenOf(node).filter((child) => !BRACKETS.has(child.name))
}

function splitBy(nodes: GroqNode[], name: string): GroqNode[][] {
  const parts: GroqNode[][] = [[]]
  for (const node of nodes) {
    if (node.name === name) parts.push([])
    else parts[parts.length - 1].push(node)
  }
  return parts
}

function chainName(type: SchemaType): string[] {
  const names: string[] = []
  for (let current: SchemaType | undefined = type; current; current = current.type) {
    names.push(current.name)
  }
  return names
}

function fieldsOf(type: SchemaType): {name: string; type: SchemaType}[] {
  try {
    return 'fields' in type && Array.isArray(type.fields) ? type.fields : []
  } catch {
    return []
  }
}

/**
 * The compiled schema resolves member and field types when they are first read, and throws for
 * a type it does not know; such a value is not checked, rather than failing the whole lint
 */
function shapeOf(read: () => SchemaType): Shape {
  try {
    const type = read()
    const names = chainName(type)
    if (names.includes('crossDatasetReference') || names.includes('globalDocumentReference')) {
      return UNKNOWN
    }
    if (names.includes('reference') && 'to' in type && Array.isArray(type.to)) {
      return {kind: 'reference', types: type.to}
    }
    if (type.jsonType === 'array') {
      const members = 'of' in type && Array.isArray(type.of) ? type.of : []
      return {kind: 'array', of: union(members.map((member) => shapeOf(() => member)))}
    }
    if (type.jsonType === 'object') {
      return fieldsOf(type).length > 0 ? {kind: 'object', types: [type]} : UNKNOWN
    }
    return {kind: 'value', type: type.name}
  } catch {
    return UNKNOWN
  }
}

function unique(types: readonly SchemaType[]): SchemaType[] {
  return [...new Set(types)]
}

/** One shape for values that have any of these; `unknown` when they do not agree */
function union(shapes: Shape[]): Shape {
  const [first] = shapes
  if (!first) return UNKNOWN
  if (shapes.every((shape) => shape.kind === 'object')) {
    return {kind: 'object', types: unique(shapes.flatMap((shape) => shape.types))}
  }
  if (shapes.every((shape) => shape.kind === 'reference')) {
    return {kind: 'reference', types: unique(shapes.flatMap((shape) => shape.types))}
  }
  if (shapes.every((shape) => shape.kind === 'array')) {
    return {kind: 'array', of: union(shapes.map((shape) => shape.of))}
  }
  if (shapes.every((shape) => shape.kind === 'value')) return first
  return UNKNOWN
}

/**
 * Edit distance with two swapped letters counting as one edit (`nmae` is one from `name`), to
 * suggest the name that was probably meant
 */
function distance(a: string, b: string): number {
  const rows = Array.from({length: a.length + 1}, (_, i) =>
    Array.from({length: b.length + 1}, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  )
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      rows[i][j] = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + cost)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        rows[i][j] = Math.min(rows[i][j], rows[i - 2][j - 2] + 1)
      }
    }
  }
  return rows[a.length][b.length]
}

function closest(name: string, candidates: Iterable<string>): string | undefined {
  let best: string | undefined
  let bestDistance = Math.max(1, Math.floor(name.length / 3)) + 1
  const lower = name.toLowerCase()
  for (const candidate of candidates) {
    const score = candidate.toLowerCase() === lower ? 0 : distance(name, candidate)
    if (score < bestDistance) {
      best = candidate
      bestDistance = score
    }
  }
  return best
}

function quoteList(names: string[]): string {
  const quoted = names.map((name) => `\`${name}\``)
  return quoted.length > 1
    ? `${quoted.slice(0, -1).join(', ')} or ${quoted[quoted.length - 1]}`
    : (quoted[0] ?? '')
}

function stringValue(node: GroqNode, query: string): string | undefined {
  if (node.name !== 'String') return undefined
  const text = textOf(query, node)
  if (text.startsWith('"')) {
    try {
      const value: unknown = JSON.parse(text)
      return typeof value === 'string' ? value : undefined
    } catch {
      return undefined
    }
  }
  return text.slice(1, -1)
}

interface Context {
  query: string
  schema: QuerySchema
  findings: SchemaFinding[]
  /** The scopes `^` reaches, innermost last */
  parents: Shape[]
}

/**
 * The document types a filter's condition pins `_type` to (`_type == "post"`,
 * `_type in ["post", "page"]`, joined with `&&` and `||`, in parentheses), with the string node
 * of each name; `null` when it does not pin them
 */
function typeConstraint(nodes: GroqNode[], query: string): {name: string; node: GroqNode}[] | null {
  const disjuncts = splitBy(nodes, 'Or').map((disjunct) => {
    let constraint: {name: string; node: GroqNode}[] | null = null
    for (const conjunct of splitBy(disjunct, 'And')) {
      const names = conjunctConstraint(conjunct, query)
      if (names === null) continue
      constraint =
        constraint === null
          ? names
          : constraint.filter((entry) => names.some((name) => name.name === entry.name))
    }
    return constraint
  })
  if (disjuncts.some((disjunct) => disjunct === null)) return null
  return disjuncts.flatMap((disjunct) => disjunct ?? [])
}

function conjunctConstraint(
  nodes: GroqNode[],
  query: string,
): {name: string; node: GroqNode}[] | null {
  if (nodes.length === 1 && nodes[0].name === 'ParenExpression') {
    return typeConstraint(innerOf(nodes[0]), query)
  }
  if (nodes.length !== 3) return null
  const [left, operator, right] = nodes
  const isType = (node: GroqNode) => node.name === 'Identifier' && textOf(query, node) === '_type'
  if (operator.name === 'EqualityOp' && textOf(query, operator) === '==') {
    const string = isType(left) ? right : isType(right) ? left : undefined
    const name = string ? stringValue(string, query) : undefined
    return string && name !== undefined ? [{name, node: string}] : null
  }
  if (operator.name === 'In' && isType(left) && right.name === 'ArrayLiteral') {
    const items = innerOf(right).filter((item) => item.name !== ',')
    const names = items.map((item) => ({name: stringValue(item, query), node: item}))
    return names.every((entry) => entry.name !== undefined)
      ? names.map((entry) => ({name: entry.name ?? '', node: entry.node}))
      : null
  }
  return null
}

/** The scope narrowed by a condition on `_type`, reporting type names nothing in it has */
function narrow(scope: Shape, condition: GroqNode[], context: Context): Shape {
  const constraint = typeConstraint(condition, context.query)
  if (!constraint) return scope
  const {documents} = context.schema
  if (scope.kind === 'documents') {
    const types: SchemaType[] = []
    for (const {name, node} of constraint) {
      const type = documents.get(name)
      if (type) {
        types.push(type)
        continue
      }
      const suggestion = closest(name, documents.keys())
      context.findings.push({
        rule: 'unknown-type',
        from: node.from,
        to: node.to,
        message: `The schema has no document type named \`${name}\`.${suggestion ? ` Did you mean \`${suggestion}\`?` : ''}`,
        ...(suggestion
          ? {suggestion: {text: JSON.stringify(suggestion), from: node.from, to: node.to}}
          : {}),
      })
    }
    return types.length > 0 ? {kind: 'object', types: unique(types)} : UNKNOWN
  }
  if (scope.kind === 'object') {
    const names = new Set(constraint.map((entry) => entry.name))
    const types = scope.types.filter((type) => names.has(type.name))
    for (const {name, node} of constraint) {
      if (scope.types.some((type) => type.name === name) || documents.has(name)) continue
      const suggestion = closest(
        name,
        scope.types.map((type) => type.name),
      )
      context.findings.push({
        rule: 'unknown-type',
        from: node.from,
        to: node.to,
        message: `Nothing here is of type \`${name}\`: it is ${quoteList(typeNames(scope))}.${suggestion ? ` Did you mean \`${suggestion}\`?` : ''}`,
        ...(suggestion
          ? {suggestion: {text: JSON.stringify(suggestion), from: node.from, to: node.to}}
          : {}),
      })
    }
    return types.length > 0 ? {kind: 'object', types} : scope
  }
  return scope
}

function describeValue(shape: Shape): string {
  return shape.kind === 'value' ? `a ${shape.type}` : 'not an object'
}

/** The names of an object's possible types, an inline one by the field that holds it */
function typeNames(shape: Extract<Shape, {kind: 'object'}>): string[] {
  return [
    ...new Set(
      shape.types.map((type) => (type.name === 'object' ? (shape.label ?? type.name) : type.name)),
    ),
  ]
}

/** The shape with inline objects in it named by `label` */
function labelled(shape: Shape, label: string): Shape {
  if (shape.kind === 'object') return {...shape, label}
  if (shape.kind === 'array') return {kind: 'array', of: labelled(shape.of, label)}
  return shape
}

/** What a postfix step applies to: the chain's text so far, and the `.` of a dot access */
interface Holder {
  text: string
  dot?: GroqNode
}

/** The shape of field `name` of a value, reporting a field the value cannot have */
function field(shape: Shape, nameNode: GroqNode, context: Context, holder?: Holder): Shape {
  const name = textOf(context.query, nameNode)
  switch (shape.kind) {
    case 'unknown':
    case 'documents':
      return UNKNOWN
    case 'array':
      return {kind: 'array', of: field(shape.of, nameNode, context, holder)}
    case 'object': {
      if (SYSTEM_FIELDS.has(name)) return {kind: 'value', type: 'string'}
      const matches = shape.types.flatMap((type) =>
        fieldsOf(type)
          .filter((candidate) => candidate.name === name)
          .map((candidate) => shapeOf(() => candidate.type)),
      )
      if (matches.length > 0) return labelled(union(matches), name)
      const fieldNames = new Set(shape.types.flatMap((type) => fieldsOf(type).map((f) => f.name)))
      const suggestion = closest(name, fieldNames)
      context.findings.push({
        rule: 'unknown-field',
        from: nameNode.from,
        to: nameNode.to,
        message: `\`${name}\` is not a field of ${quoteList(typeNames(shape))}.${suggestion ? ` Did you mean \`${suggestion}\`?` : ''}`,
        ...(suggestion
          ? {suggestion: {text: suggestion, from: nameNode.from, to: nameNode.to}}
          : {}),
      })
      return UNKNOWN
    }
    case 'reference': {
      if (REFERENCE_FIELDS.has(name)) return {kind: 'value', type: 'string'}
      const holderText = holder?.text ?? 'the reference'
      const {dot} = holder ?? {}
      context.findings.push({
        rule: 'not-a-reference',
        from: nameNode.from,
        to: nameNode.to,
        message: `\`${holderText}\` is a reference, which holds no \`${name}\`: follow it with \`${holderText}->${name}\`.`,
        ...(dot ? {suggestion: {text: '->', from: dot.from, to: dot.to}} : {}),
      })
      return UNKNOWN
    }
    case 'value':
      context.findings.push({
        rule: 'unknown-field',
        from: nameNode.from,
        to: nameNode.to,
        message: `\`${holder?.text ?? 'This'}\` is ${describeValue(shape)}, which has no \`${name}\`.`,
      })
      return UNKNOWN
    default: {
      const unhandled: never = shape
      return unhandled
    }
  }
}

function dereference(shape: Shape, node: GroqNode, context: Context, holder?: Holder): Shape {
  switch (shape.kind) {
    case 'reference':
      return shape.types.length > 0 ? {kind: 'object', types: shape.types} : {kind: 'documents'}
    case 'array':
      return {kind: 'array', of: dereference(shape.of, node, context, holder)}
    case 'object':
    case 'value': {
      // The `->` itself, which a dereference with an attribute (`->name`) starts with
      const arrow = node.getChild('Deref') ?? node
      context.findings.push({
        rule: 'not-a-reference',
        from: arrow.from,
        to: arrow.to,
        message: `\`${holder?.text ?? 'This'}\` is not a reference, so \`->\` gives null.`,
      })
      return UNKNOWN
    }
    default:
      return UNKNOWN
  }
}

function itemOf(shape: Shape): Shape {
  return shape.kind === 'array' ? shape.of : shape
}

/** `[0]`, `[2...5]` or `[$start..$end]`: picks items rather than filtering them */
function isSlice(inner: GroqNode[]): boolean {
  return inner.every((node) =>
    ['Number', 'Parameter', 'Ellipsis', '..', 'Range', '-', 'Minus'].includes(node.name),
  )
}

/**
 * A filter reads each item of `shape`; `outer` is the scope the filter is written in, which is
 * what `^` reaches inside it
 */
function applyFilter(shape: Shape, filter: GroqNode, outer: Shape, context: Context): Shape {
  const inner = innerOf(filter)
  if (isSlice(inner)) {
    const isIndex = inner.length === 1 || (inner.length === 2 && inner[0].name !== 'Number')
    return isIndex ? itemOf(shape) : shape
  }
  const scope = narrow(itemOf(shape), inner, context)
  evaluate(inner, scope, {...context, parents: [...context.parents, outer]})
  return shape.kind === 'array' ? {kind: 'array', of: scope} : scope
}

function applyProjection(
  shape: Shape,
  projection: GroqNode,
  outer: Shape,
  context: Context,
): Shape {
  evaluateEntries(innerOf(projection), itemOf(shape), {
    ...context,
    parents: [...context.parents, outer],
  })
  return shape.kind === 'array' ? {kind: 'array', of: UNKNOWN} : UNKNOWN
}

/** The entries of a projection or object literal, each in the scope it reads from */
function evaluateEntries(nodes: GroqNode[], scope: Shape, context: Context): void {
  for (const entry of splitBy(nodes, ',')) {
    if (entry.length === 0) continue
    const arrow = entry.findIndex((node) => node.name === 'Arrow')
    if (arrow !== -1) {
      const condition = entry.slice(0, arrow)
      evaluate(condition, scope, context)
      const narrowed = narrow(scope, condition, context)
      const value = entry.slice(arrow + 1)
      if (value.length === 1 && value[0].name === 'ObjectLiteral') {
        evaluateEntries(innerOf(value[0]), narrowed, context)
      } else {
        evaluate(value, narrowed, context)
      }
      continue
    }
    if (entry[0].name === 'PropertyPair') {
      const pair = childrenOf(entry[0])
      const colon = pair.findIndex((node) => node.name === ':')
      evaluate(pair.slice(colon + 1), scope, context)
      continue
    }
    if (entry[0].name === 'Spread') {
      evaluate(entry.slice(1), scope, context)
      continue
    }
    evaluate(entry, scope, context)
  }
}

/** A function's arguments, each read in the scope of the call */
function evaluateArguments(call: GroqNode, scope: Shape, context: Context): void {
  const args = innerOf(call).filter((node) => node.name !== 'FunctionName')
  for (const arg of splitBy(args, ',')) evaluate(arg, scope, context)
}

/** A primary node followed by its postfix chain: `author->{name}`, `*[_type == "post"]` */
function evaluateChain(nodes: GroqNode[], scope: Shape, context: Context): Shape {
  const [head, ...rest] = nodes
  let shape: Shape
  switch (head.name) {
    case 'Everything':
      shape = {kind: 'array', of: {kind: 'documents'}}
      break
    case 'Identifier':
      shape = field(scope, head, context)
      break
    case 'This':
      shape = scope
      break
    case 'Parent':
      shape = context.parents.at(-1) ?? UNKNOWN
      break
    case 'String':
      shape = {kind: 'value', type: 'string'}
      break
    case 'Number':
      shape = {kind: 'value', type: 'number'}
      break
    case 'True':
    case 'False':
      shape = {kind: 'value', type: 'boolean'}
      break
    case 'FunctionCall':
    case 'NamespacedCall':
      evaluateArguments(head, scope, context)
      shape = UNKNOWN
      break
    case 'ArrayLiteral':
      for (const item of splitBy(innerOf(head), ',')) evaluate(item, scope, context)
      shape = UNKNOWN
      break
    case 'ObjectLiteral':
      evaluateEntries(innerOf(head), scope, context)
      shape = UNKNOWN
      break
    case 'ParenExpression':
      shape = evaluate(innerOf(head), scope, context)
      break
    default:
      shape = UNKNOWN
  }

  let previous: GroqNode = head
  // The chain so far, which the next step applies to
  const holder = (dot?: GroqNode): Holder => ({
    text: context.query.slice(head.from, previous.to),
    dot,
  })
  for (const node of rest) {
    switch (node.name) {
      case 'DotAccess': {
        const name = node.getChild('Identifier')
        shape = name ? field(shape, name, context, holder(node.firstChild ?? undefined)) : UNKNOWN
        break
      }
      case 'Dereference':
        shape = dereference(shape, node, context, holder())
        break
      case 'DerefAccess': {
        shape = dereference(shape, node, context, holder())
        const name = node.getChild('Identifier')
        shape = name ? field(shape, name, context) : UNKNOWN
        break
      }
      case 'ArrayTraversal':
        if (shape.kind !== 'array') shape = UNKNOWN
        break
      case 'Filter':
        shape = applyFilter(shape, node, scope, context)
        break
      case 'Projection':
        shape = applyProjection(shape, node, scope, context)
        break
      default:
        shape = UNKNOWN
    }
    previous = node
  }
  return shape
}

/**
 * An expression as the editor's grammar gives it, a flat run of chains and operators: checks
 * every chain, and returns the shape of one that stands alone. A pipe hands the shape before it
 * to `order()` and `score()`, whose arguments read its items.
 */
function evaluate(nodes: GroqNode[], scope: Shape, context: Context): Shape {
  const shapes: Shape[] = []
  let chain: GroqNode[] = []
  let piped: Shape | undefined
  const close = () => {
    if (chain.length === 0) return
    const [head, ...rest] = chain
    if (piped && (head.name === 'FunctionCall' || head.name === 'NamespacedCall')) {
      // `| order(…)` and `| score(…)` read each item and leave the items as they were
      evaluateArguments(head, itemOf(piped), {...context, parents: [...context.parents, scope]})
      let shape: Shape = piped
      for (const node of rest) {
        if (node.name === 'Filter') shape = applyFilter(shape, node, scope, context)
        else if (node.name === 'Projection') shape = applyProjection(shape, node, scope, context)
        else shape = UNKNOWN
      }
      shapes.push(shape)
    } else {
      shapes.push(evaluateChain(chain, scope, context))
    }
    piped = undefined
    chain = []
  }
  for (const node of nodes) {
    if (chain.length > 0 && POSTFIX.has(node.name)) {
      chain.push(node)
      continue
    }
    if (PRIMARY.has(node.name)) {
      close()
      chain = [node]
      continue
    }
    if (node.name === 'Pipe') {
      const before = chain.length > 0 ? evaluateChain(chain, scope, context) : shapes.pop()
      chain = []
      piped = before ?? UNKNOWN
      continue
    }
    close()
  }
  close()
  // A lone chain, piped or not, has a shape; a comparison, arithmetic and the like do not
  const alone = nodes.every(
    (node) => PRIMARY.has(node.name) || POSTFIX.has(node.name) || node.name === 'Pipe',
  )
  return alone && shapes.length === 1 ? shapes[0] : UNKNOWN
}

export function checkQuerySchema(
  tree: GroqTree,
  query: string,
  schema: QuerySchema,
): SchemaFinding[] {
  if (hasSyntaxErrors(tree)) return []
  const context: Context = {query, schema, findings: [], parents: []}
  // Function bodies read their parameter, whose shape the query does not say
  const nodes = childrenOf(tree.topNode).filter(
    (node) => node.name !== 'FunctionDef' && node.name !== ';',
  )
  evaluate(nodes, UNKNOWN, context)
  return context.findings
}
