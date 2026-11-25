import {type ExprNode, parse, unparse} from 'groq-js'

/** Which filter a candidate value, or the values a trace lists, would be the tag of */
export type SyncTagCandidateKind = 'id' | 'type' | 'slug'

/**
 * A query that lists values the response's tags may stand for, which the response itself does
 * not show: the documents a `->` reads wherever it stands (a filter, `order()`, `count()`, a
 * projection of a dereferenced document), and whatever a `_id`, `_type` or `slug.current` is
 * compared with when that is computed (a parent's field, a subquery, a function of a param).
 * Evaluated with the query's own params and perspective.
 */
export interface SyncTagTrace {
  kind: SyncTagCandidateKind
  query: string
  /**
   * For the trace of the documents a `->` reads: a query listing only those it fails to read,
   * worth evaluating when the trace lists more documents than a response is tagged with one by
   * one, since the response is still tagged with the ids of those
   */
  missingQuery?: string
}

/** What a query's text says its response's tags may stand for */
export interface QuerySyncTagCandidates {
  /** Ids the query compares `_id` with, written out or given as params */
  ids: string[]
  /** Types the query compares `_type` with */
  types: string[]
  /** Slugs the query compares `slug.current` with */
  slugs: string[]
  traces: SyncTagTrace[]
  /**
   * Whether the query takes a slice or an element of the documents it filters, and so may
   * stop reading them before the end, which leaves a response tagged with the documents its
   * filter dereferenced on the way rather than with every one it would have
   */
  sliced: boolean
}

/** Trace queries one lookup evaluates at most; the rest of the query goes untraced */
export const MAX_SYNC_TAG_TRACES = 12
/**
 * Documents a response is tagged with one by one at most: a response that dereferences more of
 * them is tagged with their types instead (observed above about a hundred), so the trace of
 * their types is worth probing before a longer list of ids, which only a request that stopped
 * reading early (a slice) is tagged with, and then with the first of them
 */
export const MAX_TRACED_DOCUMENTS = 100
/** Values one trace returns at most; one past the documents, so a longer list can be told apart */
export const MAX_SYNC_TAG_TRACE_VALUES = MAX_TRACED_DOCUMENTS + 1

const EMPTY: QuerySyncTagCandidates = {ids: [], types: [], slugs: [], traces: [], sliced: false}

/**
 * A scope the query opens, from the outermost in. `@` inside it is an element of `base` (a
 * filter, a map, `order()`), or `base` itself (a projection). `base` is written relative to the
 * scope around it.
 */
interface Level {
  base: ExprNode
  /**
   * Whether writing the scope as `base{"v": …}` opens the same number of scopes the query did:
   * it opens two (the map and its projection), which a map followed by a projection of `@` did
   * too (`*[…]{…}`), and a projection of one value opens one. A bare map, filter or pipe
   * function opened one, so the trace's `^` need to reach one further.
   */
  extraScope: boolean
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

function unwrap(node: ExprNode): ExprNode {
  return node.type === 'Group' ? unwrap(node.base) : node
}

/** The expression `@` stands for, or nothing when the node reads `@` of a scope around it */
function isThis(node: ExprNode | undefined): boolean {
  return node === undefined || node.type === 'This'
}

/**
 * The filter a comparison of this attribute path is tagged by: `_id` and `_type` of `@`, and a
 * `slug.current` under any plain attribute path of `@`.
 */
function pathKind(node: ExprNode): SyncTagCandidateKind | undefined {
  const path = unwrap(node)
  if (path.type !== 'AccessAttribute') return undefined
  if (isThis(path.base)) {
    if (path.name === '_id') return 'id'
    if (path.name === '_type') return 'type'
    return undefined
  }
  if (path.name !== 'current') return undefined
  let step: ExprNode | undefined = path.base
  if (step?.type !== 'AccessAttribute' || step.name !== 'slug') return undefined
  while (step && step.type === 'AccessAttribute') step = step.base
  return isThis(step) ? 'slug' : undefined
}

/** Whether a node evaluates to an array, as far as its shape tells */
function isArrayNode(node: ExprNode, params: Record<string, unknown>): boolean {
  switch (node.type) {
    case 'Everything':
    case 'Filter':
    case 'Slice':
    case 'Map':
    case 'FlatMap':
    case 'Array':
    case 'ArrayCoerce':
    case 'PipeFuncCall':
      return true
    case 'Group':
      return isArrayNode(node.base, params)
    case 'Parameter':
      return Array.isArray(params[node.name])
    case 'FuncCall':
      return node.namespace === 'array' || node.name === 'array'
    default:
      return false
  }
}

/** Scopes a node opens for its children, counted from a child's point of view */
function scopesOpened(node: ExprNode, child: ExprNode): number {
  switch (node.type) {
    case 'Filter':
    case 'Map':
    case 'FlatMap':
    case 'Projection':
      return child === node.expr ? 1 : 0
    case 'PipeFuncCall':
      return node.args.includes(child) ? 1 : 0
    default:
      return 0
  }
}

/**
 * The same expression with every `^` that reaches past the expression's own scopes moved by
 * `delta` scopes: up when the trace wraps it in more scopes than the query did, down when the
 * trace evaluates it in a scope nearer the root. A `^` that comes to point at the expression's
 * own scope becomes `@`.
 */
function shiftParents(node: ExprNode, delta: number, depth = 0): ExprNode {
  if (node.type === 'Parent') {
    if (node.n <= depth) return node
    const n = node.n + delta
    return n === 0 ? {type: 'This'} : {type: 'Parent', n}
  }
  const copy: Record<string, unknown> = {...node}
  for (const [key, value] of Object.entries(node)) {
    if (Array.isArray(value)) {
      copy[key] = value.map((item: unknown) =>
        isNode(item) ? shiftParents(item, delta, depth + scopesOpened(node, item)) : item,
      )
    } else if (isNode(value)) {
      copy[key] = shiftParents(value, delta, depth + scopesOpened(node, value))
    }
  }
  return copy as unknown as ExprNode
}

/**
 * How many scopes nearer the root an expression can be evaluated in without changing its
 * meaning: all of them when it reads neither `@` nor `^`, none when it reads `@`, and otherwise
 * up to the nearest scope a `^` reaches.
 */
function liftableScopes(node: ExprNode, depth: number): number {
  let nearest = Infinity
  const visit = (current: ExprNode, inner: number) => {
    if (nearest === 0) return
    if (current.type === 'This' || (current.type === 'AccessAttribute' && !current.base)) {
      if (inner === 0) nearest = 0
    } else if (current.type === 'Parent') {
      if (current.n >= inner) nearest = Math.min(nearest, current.n - inner)
    }
    forEachChild(current, (child) => visit(child, inner + scopesOpened(current, child)))
  }
  visit(node, 0)
  return nearest === Infinity ? depth : Math.min(nearest, depth)
}

/** Separates the dataset from the id in what an id trace lists for a cross-dataset reference */
export const TRACED_DATASET_SEPARATOR = ':'

/**
 * What a reference points at, as an id trace lists it: the `_ref`, with the `_dataset` in front
 * of it when the reference crosses datasets, since the tag of such a document is one of its own
 * dataset. Neither an id nor a dataset name contains the separator.
 */
function referencedId(reference: ExprNode): ExprNode {
  const attribute = (name: string): ExprNode => ({type: 'AccessAttribute', base: reference, name})
  const concat = (left: ExprNode, right: ExprNode): ExprNode => ({
    type: 'OpCall',
    op: '+',
    left,
    right,
  })
  return {
    type: 'FuncCall',
    namespace: 'global',
    name: 'coalesce',
    args: [
      concat(
        concat(attribute('_dataset'), {type: 'Value', value: TRACED_DATASET_SEPARATOR}),
        attribute('_ref'),
      ),
      attribute('_ref'),
    ],
  }
}

/**
 * What a reference points at only when that is no document the perspective reads, so that a
 * trace of it lists the references that dereference to nothing. A response is tagged with the
 * id of such a document however many documents it read, since it has no type to be tagged with
 * instead.
 */
function missingReferencedId(reference: ExprNode): ExprNode {
  return {
    type: 'Select',
    alternatives: [
      {
        type: 'SelectAlternative',
        condition: {
          type: 'Not',
          base: {
            type: 'FuncCall',
            namespace: 'global',
            name: 'defined',
            args: [{type: 'AccessAttribute', base: {type: 'Deref', base: reference}, name: '_id'}],
          },
        },
        value: referencedId(reference),
      },
    ],
  }
}

function stringValues(value: unknown): string[] {
  if (typeof value === 'string') return value ? [value] : []
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && item !== '')
  }
  return []
}

class Collector {
  readonly ids = new Set<string>()
  readonly types = new Set<string>()
  readonly slugs = new Set<string>()
  readonly traces = new Map<string, Omit<SyncTagTrace, 'query'>>()
  sliced = false
  private readonly params: Record<string, unknown>

  constructor(params: Record<string, unknown>) {
    this.params = params
  }

  private add(kind: SyncTagCandidateKind, values: readonly string[]) {
    const set = kind === 'id' ? this.ids : kind === 'type' ? this.types : this.slugs
    for (const value of values) set.add(value)
  }

  /** A value compared with `_id`, `_type` or `slug.current`, or an expression computing one */
  operand(kind: SyncTagCandidateKind, node: ExprNode, levels: readonly Level[]) {
    const operand = unwrap(node)
    switch (operand.type) {
      case 'Value':
        this.add(kind, stringValues(operand.value))
        return
      case 'Parameter':
        this.add(kind, stringValues(this.params[operand.name]))
        return
      case 'Array':
        for (const element of operand.elements) {
          if (element.isSplat) this.trace(kind, element.value, levels)
          else this.operand(kind, element.value, levels)
        }
        return
      case 'FuncCall':
        // `_id in path("a.*")` matches by prefix, which no tag of a single document stands for
        if (operand.name === 'path') return
        this.trace(kind, operand, levels)
        return
      default:
        this.trace(kind, operand, levels)
    }
  }

  /**
   * A trace query for an expression: the expression wrapped in each scope the query evaluates
   * it in, from the innermost out, each as a projection that lists what the expression gave
   * for each element. Scopes it does not read are left out, so a parent's field compared in a
   * subquery is listed once per parent, not once per subquery row.
   */
  trace(kind: SyncTagCandidateKind, node: ExprNode, levels: readonly Level[]) {
    const query = this.traceQuery(node, levels)
    if (query !== undefined && !this.traces.has(query)) this.traces.set(query, {kind})
  }

  /**
   * The trace of the documents a `->` reads, with the trace of those it fails to read beside
   * it; the main trace alone when the second cannot be written out
   */
  traceDeref(reference: ExprNode, levels: readonly Level[]) {
    const query = this.traceQuery(referencedId(reference), levels)
    if (query === undefined || this.traces.has(query)) return
    const missingQuery = this.traceQuery(missingReferencedId(reference), levels)
    this.traces.set(query, missingQuery === undefined ? {kind: 'id'} : {kind: 'id', missingQuery})
  }

  /** The trace query for an expression, or nothing for one it cannot write out as a query */
  private traceQuery(node: ExprNode, levels: readonly Level[]): string | undefined {
    const lifted = liftableScopes(node, levels.length)
    let expr = shiftParents(node, -lifted)
    let isArray = isArrayNode(expr, this.params)
    try {
      for (let index = levels.length - lifted - 1; index >= 0; index--) {
        const level = levels[index]
        if (level.extraScope) expr = shiftParents(expr, 1)
        const text = `${unparse(level.base)}{"v": ${unparse(expr)}}.v`
        const wrapped = parse(text)
        // A map lists one value per element; when those are arrays, flatten them
        if (wrapped.type !== 'Map') {
          expr = wrapped
        } else {
          expr = isArray ? parse(`${text}[]`) : wrapped
          isArray = true
        }
      }
      const list = isArray ? unparse(expr) : `[${unparse(expr)}]`
      const query = `array::unique(array::compact(${list}))[0...${MAX_SYNC_TAG_TRACE_VALUES}]`
      parse(query)
      return query
    } catch {
      return undefined
    }
  }

  visit(node: ExprNode, levels: readonly Level[]) {
    switch (node.type) {
      case 'Filter':
        this.visit(node.base, levels)
        this.visitFilter(node.expr, levels, node.base)
        return
      case 'Map':
      case 'FlatMap': {
        this.visit(node.base, levels)
        const {expr} = node
        if (expr.type === 'Projection' && expr.base.type === 'This') {
          this.visit(expr.expr, [...levels, {base: node.base, extraScope: false}])
        } else {
          this.visit(expr, [...levels, {base: node.base, extraScope: true}])
        }
        return
      }
      case 'Projection':
        this.visit(node.base, levels)
        this.visit(node.expr, [...levels, {base: node.base, extraScope: false}])
        return
      case 'PipeFuncCall': {
        this.visit(node.base, levels)
        const inner = [...levels, {base: node.base, extraScope: true}]
        for (const arg of node.args) this.visit(arg, inner)
        return
      }
      case 'Deref':
        this.visit(node.base, levels)
        this.traceDeref(node.base, levels)
        // Dereferencing many documents tags the response with their type instead of each id
        this.trace('type', {type: 'AccessAttribute', base: node, name: '_type'}, levels)
        return
      case 'Slice':
      case 'AccessElement':
        // A slice of what `order()` sorted comes after every document was read
        if (unwrap(node.base).type !== 'PipeFuncCall') this.sliced = true
        forEachChild(node, (child) => this.visit(child, levels))
        return
      case 'OpCall': {
        const left = pathKind(node.left)
        if (node.op === '==' || node.op === 'in') {
          if (left) this.operand(left, node.right, levels)
          else if (node.op === '==') {
            const right = pathKind(node.right)
            if (right) this.operand(right, node.left, levels)
          }
        }
        forEachChild(node, (child) => this.visit(child, levels))
        return
      }
      default:
        forEachChild(node, (child) => this.visit(child, levels))
    }
  }

  /**
   * The conjuncts of a filter, each evaluated among the documents the conjuncts before it keep:
   * what `*[_type == "a" && author->name == "x"]` dereferences is the authors of the `a`s
   */
  private visitFilter(expr: ExprNode, levels: readonly Level[], base: ExprNode) {
    const level: Level = {base, extraScope: true}
    if (expr.type === 'And') {
      this.visitFilter(expr.left, levels, base)
      this.visitFilter(expr.right, levels, {type: 'Filter', base, expr: expr.left})
      return
    }
    this.visit(expr, [...levels, level])
  }
}

/**
 * The ids, types and slugs a query's text compares `_id`, `_type` and `slug.current` with, and
 * the traces that list the values it computes for those and the documents it dereferences. A
 * query that does not parse has no candidates.
 */
export function collectQuerySyncTagCandidates(
  query: string,
  params: Record<string, unknown> = {},
): QuerySyncTagCandidates {
  let ast: ExprNode
  try {
    // Without params the AST keeps `$param` nodes, which the traces need as written; a query
    // that needs a param's value to parse (a slice bound) gets them written in instead
    ast = parse(query)
  } catch {
    try {
      ast = parse(query, {params})
    } catch {
      return EMPTY
    }
  }
  const collector = new Collector(params)
  collector.visit(ast, [])
  return {
    ids: [...collector.ids],
    types: [...collector.types],
    slugs: [...collector.slugs],
    traces: [...collector.traces]
      .slice(0, MAX_SYNC_TAG_TRACES)
      .map(([traceQuery, trace]) => ({...trace, query: traceQuery})),
    sliced: collector.sliced,
  }
}

/** The strings anywhere in a trace's result, nested arrays included */
export function flattenTraceValues(result: unknown): string[] {
  const values: string[] = []
  const queue: unknown[] = [result]
  // Index walk: `shift()` is O(n) per step and `push(...huge)` overflows the call stack
  for (let head = 0; head < queue.length; head++) {
    const node = queue[head]
    if (typeof node === 'string') {
      if (node) values.push(node)
    } else if (Array.isArray(node)) {
      for (const item of node) {
        queue.push(item)
      }
    }
  }
  return values
}
