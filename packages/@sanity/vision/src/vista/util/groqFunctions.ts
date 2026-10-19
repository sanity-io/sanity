import {parser} from '@sanity/lezer-groq'

import {type VistaSavedFunction} from '../store/types'
import {
  findGroqFunction,
  functionId,
  GROQ_FUNCTIONS,
  isKnownGroqFunction,
} from './groqFunctionReference'

/**
 * Custom GROQ functions (`fn ns::name($param) = $param{…};` at the start of a query) and the
 * calls a query makes, read from the lezer syntax tree the query editor highlights with: it has
 * positions, which groq-js errors do not, and it accepts what the API does (`releases::all()`,
 * `text::query()`) without knowing every function.
 */

export type GroqTree = ReturnType<typeof parser.parse>
export type GroqNode = GroqTree['topNode']

export interface TextRange {
  from: number
  to: number
}

export interface FunctionDeclaration {
  /** `ex::author`; just the name when the namespace is missing */
  id: string
  namespace: string | undefined
  name: string
  /** The namespace and the name */
  nameRange: TextRange
  parameters: (TextRange & {name: string})[]
  /** From `fn` to the end of the body; the `;` is not part of it */
  range: TextRange
  /** The body's nodes, after `=` */
  body: GroqNode[]
  text: string
}

export interface FunctionCall {
  /** `undefined` for a call written without one, which calls a global function */
  namespace: string | undefined
  name: string
  /** The namespace (when written) and the name */
  nameRange: TextRange
  range: TextRange
  argCount: number
  /** Made after `|` */
  piped: boolean
  node: GroqNode
}

export interface QueryFunctions {
  declarations: FunctionDeclaration[]
  calls: FunctionCall[]
}

export type FunctionFindingRule =
  | 'namespace'
  | 'parameters'
  | 'body-shape'
  | 'body-parameter'
  | 'parameter-reuse'
  | 'parent-scope'
  | 'recursion'
  | 'duplicate'
  | 'shadows-builtin'
  | 'unknown-function'
  | 'arity'
  | 'delta-only'
  | 'pipe'
  | 'score-only'

export interface FunctionFinding {
  rule: FunctionFindingRule
  severity: 'error' | 'warning'
  /** GROQ in backticks, like the `groq-lint` messages */
  message: string
  from: number
  to: number
  /** A library function the call could be declared from */
  libraryFunction?: VistaSavedFunction
}

const DEFAULT_NAMESPACE = 'my'
/** Reading the whole query on every selection change is cheap for queries, not for any text */
const MAX_EXTRACT_QUERY_LENGTH = 20_000
const PARAMETER_PLACEHOLDER = '$param'

/** Nodes that continue the expression before them: `.title`, `->`, `[0]`, `{…}` */
const POSTFIX_NODES = new Set([
  'ArrayTraversal',
  'Filter',
  'Projection',
  'DotAccess',
  'ParentAccess',
  'SelectorAccess',
  'Dereference',
  'DerefAccess',
])

/** Nodes that start an expression a postfix chain can continue */
const PRIMARY_NODES = new Set([
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

export function parseGroq(query: string): GroqTree {
  return parser.parse(query)
}

export function hasSyntaxErrors(tree: GroqTree): boolean {
  let found = false
  tree.iterate({
    enter: (node) => {
      if (node.type.isError) found = true
      return !found
    },
  })
  return found
}

function isTrivia(node: GroqNode): boolean {
  return node.name === 'LineComment'
}

function children(node: GroqNode): GroqNode[] {
  const nodes: GroqNode[] = []
  for (let child = node.firstChild; child; child = child.nextSibling) {
    if (!isTrivia(child)) nodes.push(child)
  }
  return nodes
}

function previousSibling(node: GroqNode): GroqNode | null {
  let sibling = node.prevSibling
  while (sibling && isTrivia(sibling)) sibling = sibling.prevSibling
  return sibling
}

function nextSibling(node: GroqNode): GroqNode | null {
  let sibling = node.nextSibling
  while (sibling && isTrivia(sibling)) sibling = sibling.nextSibling
  return sibling
}

export function textOf(query: string, node: {from: number; to: number}): string {
  return query.slice(node.from, node.to)
}

/** Every node below `node`, depth first, with the number of scopes (projections, filters) above it */
function walk(node: GroqNode, visit: (node: GroqNode, level: number) => void, level = 0): void {
  for (let child = node.firstChild; child; child = child.nextSibling) {
    visit(child, level)
    walk(child, visit, child.name === 'Projection' || child.name === 'Filter' ? level + 1 : level)
  }
}

function readDeclaration(node: GroqNode, query: string): FunctionDeclaration | null {
  const nameNode = node.getChild('FunctionName')
  if (!nameNode) return null
  const namespaceNode = node.getChild('Namespace')
  const namespace = namespaceNode ? textOf(query, namespaceNode) : undefined
  const name = textOf(query, nameNode)
  const parameters: FunctionDeclaration['parameters'] = []
  const body: GroqNode[] = []
  let inBody = false
  for (const child of children(node)) {
    if (inBody) {
      body.push(child)
    } else if (child.name === '=') {
      inBody = true
    } else if (child.name === 'Parameter') {
      parameters.push({name: textOf(query, child), from: child.from, to: child.to})
    }
  }
  return {
    id: namespace === undefined ? name : `${namespace}::${name}`,
    namespace,
    name,
    nameRange: {from: namespaceNode?.from ?? nameNode.from, to: nameNode.to},
    parameters,
    range: {from: node.from, to: node.to},
    body,
    text: textOf(query, node),
  }
}

function readCall(node: GroqNode, query: string): FunctionCall | null {
  const nameNode = node.getChild('FunctionName')
  if (!nameNode) return null
  const namespaceNode = node.getChild('Namespace')
  let argCount = 0
  let inArgs = false
  let argumentStarted = false
  for (const child of children(node)) {
    if (!inArgs) {
      inArgs = child.name === '('
      continue
    }
    if (child.name === ')') break
    if (child.name === ',') {
      if (argumentStarted) argCount++
      argumentStarted = false
    } else {
      argumentStarted = true
    }
  }
  if (argumentStarted) argCount++
  return {
    namespace: namespaceNode ? textOf(query, namespaceNode) : undefined,
    name: textOf(query, nameNode),
    nameRange: {from: namespaceNode?.from ?? nameNode.from, to: nameNode.to},
    range: {from: node.from, to: node.to},
    argCount,
    piped: previousSibling(node)?.name === 'Pipe',
    node,
  }
}

/** The custom functions a query declares and every function call it makes, in order */
export function readQueryFunctions(tree: GroqTree, query: string): QueryFunctions {
  const declarations: FunctionDeclaration[] = []
  const calls: FunctionCall[] = []
  tree.iterate({
    enter: (ref) => {
      if (ref.name === 'FunctionDef') {
        const declaration = readDeclaration(ref.node, query)
        if (declaration) declarations.push(declaration)
      } else if (ref.name === 'FunctionCall' || ref.name === 'NamespacedCall') {
        const call = readCall(ref.node, query)
        if (call) calls.push(call)
      }
    },
  })
  return {declarations, calls}
}

/** `ex::author`, and for a global function its name */
export function callId(call: Pick<FunctionCall, 'namespace' | 'name'>): string {
  return call.namespace === undefined ? call.name : `${call.namespace}::${call.name}`
}

/** The declaration of a saved function, or `null` when it is not one */
export function parseDeclaration(declaration: string): FunctionDeclaration | null {
  const tree = parseGroq(`${declaration};\nnull`)
  if (hasSyntaxErrors(tree)) return null
  const [first] = readQueryFunctions(tree, `${declaration};\nnull`).declarations
  return first && first.range.from === 0 && first.range.to === declaration.length ? first : null
}

/** The text without whitespace, except inside strings */
function withoutLayout(text: string): string {
  let result = ''
  let quote: string | null = null
  for (let index = 0; index < text.length; index++) {
    const char = text[index]
    if (quote) {
      result += char
      if (char === '\\') {
        result += text[index + 1] ?? ''
        index++
      } else if (char === quote) {
        quote = null
      }
    } else if (char === '"' || char === "'") {
      quote = char
      result += char
    } else if (!/\s/.test(char)) {
      result += char
    }
  }
  return result
}

/** Whether two declarations say the same, however they are laid out (Prettify reflows them) */
export function isSameDeclaration(a: string, b: string): boolean {
  return withoutLayout(a) === withoutLayout(b)
}

/** `ex::author($ref)`, for lists of functions */
export function describeSignature(declaration: FunctionDeclaration): string {
  return `${declaration.id}(${declaration.parameters.map((parameter) => parameter.name).join(', ')})`
}

/** The body as written, after `=` */
export function describeBody(declaration: FunctionDeclaration): string {
  const {body} = declaration
  if (body.length === 0) return ''
  const start = body[0].from - declaration.range.from
  return declaration.text.slice(start)
}

function countArguments(count: number): string {
  return count === 1 ? 'one argument' : `${count} arguments`
}

function describeArity({min, max}: {min: number; max: number}): string {
  if (min === max) return min === 0 ? 'takes no arguments' : `takes ${countArguments(min)}`
  if (max === Infinity) return `takes at least ${countArguments(min)}`
  return `takes ${min} ${max === min + 1 ? 'or' : 'to'} ${max} arguments`
}

function isInsideScore(node: GroqNode, query: string): boolean {
  for (let parent = node.parent; parent; parent = parent.parent) {
    if (parent.name !== 'FunctionCall') continue
    const name = parent.getChild('FunctionName')
    if (name && textOf(query, name) === 'score') return true
  }
  return false
}

/** How many scopes `^` climbs: `^` one, `^.^` two */
function parentDepth(node: GroqNode): number {
  let depth = node.to - node.from
  for (let next = nextSibling(node); next?.name === 'ParentAccess'; next = nextSibling(next)) {
    const parent = next.getChild('Parent')
    depth += parent ? parent.to - parent.from : 0
  }
  return depth
}

/**
 * The checks groq-js runs on a function body (`mapCustomFunction`, `walkValidateCustomFunction`):
 * it projects its parameter in one of four forms, uses the parameter nowhere else, and every `^`
 * stays inside the body, where each projection and filter opens a scope
 */
function checkBody(declaration: FunctionDeclaration, query: string): FunctionFinding[] {
  const findings: FunctionFinding[] = []
  const [parameter] = declaration.parameters
  const parameterName = parameter?.name ?? PARAMETER_PLACEHOLDER
  const {body} = declaration
  if (body.length === 0) return findings
  const bodyRange = {from: body[0].from, to: body[body.length - 1].to}

  const base = body[0]
  if (base.name === 'Parameter' && parameter && textOf(query, base) !== parameter.name) {
    findings.push({
      rule: 'body-parameter',
      severity: 'error',
      message: `\`${textOf(query, base)}\` is not the parameter of this function, \`${parameter.name}\``,
      from: base.from,
      to: base.to,
    })
    return findings
  }
  let index = 1
  if (body[index]?.name === 'ArrayTraversal') index++
  if (body[index]?.name === 'Dereference') index++
  const projection = body[index]
  if (base.name !== 'Parameter' || projection?.name !== 'Projection' || index !== body.length - 1) {
    findings.push({
      rule: 'body-shape',
      severity: 'error',
      message: `A function body projects its parameter: \`${parameterName}{…}\`, \`${parameterName}->{…}\`, \`${parameterName}[]{…}\` or \`${parameterName}[]->{…}\``,
      ...bodyRange,
    })
    return findings
  }

  const parameterNames = new Set(declaration.parameters.map((it) => it.name))
  walk(projection, (node, level) => {
    if (node.name === 'Parameter' && parameterNames.has(textOf(query, node))) {
      findings.push({
        rule: 'parameter-reuse',
        severity: 'error',
        message: `A function can use its parameter only once, at the start of the body: \`${textOf(query, node)}\` cannot be used here`,
        from: node.from,
        to: node.to,
      })
    }
    // `^.^` is one parent chain; its second `^` belongs to the `.^` after the first
    if (
      node.name === 'Parent' &&
      node.parent?.name !== 'ParentAccess' &&
      parentDepth(node) > level
    ) {
      findings.push({
        rule: 'parent-scope',
        severity: 'error',
        message:
          'Custom functions cannot reach outside their body: `^` here refers to the scope the function is called from',
        from: node.from,
        to: node.to,
      })
    }
  })
  return findings
}

function enclosingDeclaration(
  range: TextRange,
  declarations: FunctionDeclaration[],
): FunctionDeclaration | undefined {
  return declarations.find(
    (declaration) => range.from >= declaration.range.from && range.to <= declaration.range.to,
  )
}

function checkRecursion(
  declarations: FunctionDeclaration[],
  calls: FunctionCall[],
  declared: Map<string, FunctionDeclaration>,
): FunctionFinding[] {
  const callsByCaller = new Map<string, FunctionCall[]>()
  for (const call of calls) {
    const caller = enclosingDeclaration(call.range, declarations)
    if (!caller || !declared.has(callId(call))) continue
    callsByCaller.set(caller.id, [...(callsByCaller.get(caller.id) ?? []), call])
  }
  const reaches = (from: string, target: string, seen: Set<string>): boolean => {
    if (from === target) return true
    if (seen.has(from)) return false
    seen.add(from)
    return (callsByCaller.get(from) ?? []).some((call) => reaches(callId(call), target, seen))
  }

  const findings: FunctionFinding[] = []
  for (const [caller, callerCalls] of callsByCaller) {
    for (const call of callerCalls) {
      const callee = callId(call)
      if (callee === caller) {
        findings.push({
          rule: 'recursion',
          severity: 'error',
          message: 'Custom functions cannot call themselves',
          ...call.nameRange,
        })
      } else if (reaches(callee, caller, new Set())) {
        findings.push({
          rule: 'recursion',
          severity: 'error',
          message: `Calling \`${callee}()\` here leads back to \`${caller}()\`; custom functions cannot be recursive`,
          ...call.nameRange,
        })
      }
    }
  }
  return findings
}

function checkCall(
  call: FunctionCall,
  declared: Map<string, FunctionDeclaration>,
  library: readonly VistaSavedFunction[],
  query: string,
): FunctionFinding[] {
  const id = callId(call)
  const at = call.nameRange
  const custom = call.namespace === undefined ? undefined : declared.get(id)
  const doc = custom ? undefined : findGroqFunction(call.namespace, call.name)

  if (call.piped && !doc?.pipe) {
    return [
      {
        rule: 'pipe',
        severity: 'warning',
        message: `Only \`order()\` and \`score()\` can follow \`|\`, not \`${id}()\``,
        ...at,
      },
    ]
  }
  if (custom) {
    return call.argCount === 1
      ? []
      : [
          {
            rule: 'arity',
            severity: 'error',
            message: `\`${id}()\` takes one argument, not ${call.argCount}`,
            ...at,
          },
        ]
  }
  if (!doc) {
    if (isKnownGroqFunction(call.namespace, call.name)) return []
    const libraryFunction = library.find((saved) => saved.id === id)
    return [
      {
        rule: 'unknown-function',
        severity: 'warning',
        message: libraryFunction
          ? `\`${id}()\` is not declared in this query; your functions library has it`
          : `Unknown function \`${id}()\``,
        ...at,
        libraryFunction,
      },
    ]
  }

  const findings: FunctionFinding[] = []
  if (doc.args && (call.argCount < doc.args.min || call.argCount > doc.args.max)) {
    findings.push({
      rule: 'arity',
      severity: 'error',
      message: `\`${id}()\` ${describeArity(doc.args)}, not ${call.argCount}`,
      ...at,
    })
  }
  if (doc.deltaOnly) {
    findings.push({
      rule: 'delta-only',
      severity: 'warning',
      message: `\`${id}()\` only works in delta mode, where webhooks and Sanity Functions run their filters`,
      ...at,
    })
  }
  if (doc.pipe && !call.piped) {
    findings.push({
      rule: 'pipe',
      severity: 'warning',
      message: `\`${id}()\` is a pipe function: call it after \`|\`, like \`* | ${id}(…)\``,
      ...at,
    })
  }
  if (doc.scoreOnly && !isInsideScore(call.node, query)) {
    findings.push({
      rule: 'score-only',
      severity: 'warning',
      message: `\`${id}()\` only works inside \`score()\``,
      ...at,
    })
  }
  return findings
}

/**
 * The documented limits of custom functions, which the API's parser checks but `groq-lint`
 * does not (one parameter, the four body forms, the parameter used once, no `^` out of the body,
 * no recursion), and mistakes in calls: unknown functions, argument counts, delta-only and pipe
 * functions out of place. Unknown functions are warnings, since the API may know newer ones.
 */
export function checkFunctions(
  tree: GroqTree,
  query: string,
  library: readonly VistaSavedFunction[] = [],
): FunctionFinding[] {
  const {declarations, calls} = readQueryFunctions(tree, query)
  const findings: FunctionFinding[] = []
  const declared = new Map<string, FunctionDeclaration>()
  for (const declaration of declarations) {
    if (declaration.namespace === undefined) {
      findings.push({
        rule: 'namespace',
        severity: 'error',
        message: `Custom functions need a namespace of their own: \`fn my::${declaration.name}(…)\``,
        ...declaration.nameRange,
      })
    }
    const earlier = declared.get(declaration.id)
    if (earlier) {
      findings.push({
        rule: 'duplicate',
        severity: 'warning',
        message: `\`${declaration.id}\` is declared more than once; only one of the declarations takes effect`,
        ...declaration.nameRange,
      })
    } else {
      declared.set(declaration.id, declaration)
    }
    if (
      declaration.namespace !== undefined &&
      findGroqFunction(declaration.namespace, declaration.name)
    ) {
      findings.push({
        rule: 'shadows-builtin',
        severity: 'warning',
        message: `This declaration hides the built-in \`${declaration.id}()\``,
        ...declaration.nameRange,
      })
    }
    if (declaration.parameters.length !== 1) {
      findings.push({
        rule: 'parameters',
        severity: 'error',
        message: 'A custom function takes exactly one parameter: `fn ns::name($param) = …`',
        ...declaration.nameRange,
      })
    }
    findings.push(...checkBody(declaration, query))
  }
  findings.push(...checkRecursion(declarations, calls, declared))
  for (const call of calls) {
    findings.push(...checkCall(call, declared, library, query))
  }
  return findings.toSorted((a, b) => a.from - b.from || a.to - b.to)
}

/**
 * A clearer message for a parse failure in a declaration than the parser's ("expected '::'
 * followed by a function name", "expected ')' following function arguments"), when the
 * declaration lacks a namespace or has other than one parameter
 */
export function explainDeclarationSyntaxError(
  tree: GroqTree,
  query: string,
  position: number,
): string | undefined {
  for (let node: GroqNode | null = tree.resolveInner(position, -1); node; node = node.parent) {
    if (node.name !== 'FunctionDef') continue
    const declaration = readDeclaration(node, query)
    if (!declaration) return undefined
    if (declaration.namespace === undefined) {
      return `Custom functions need a namespace of their own: \`fn my::${declaration.name}(…)\``
    }
    if (declaration.parameters.length !== 1) {
      return 'A custom function takes exactly one parameter: `fn ns::name($param) = …`'
    }
    return undefined
  }
  return undefined
}

/**
 * Where a declaration goes: after the last one, or at the start of the query with a blank line
 * before the query, the way `groq-format` lays declarations out
 */
export function declarationInsertion(
  query: string,
  declaration: string,
): {from: number; to: number; insert: string} {
  const top = parseGroq(query).topNode
  let end = -1
  for (const child of children(top)) {
    if (child.name === 'FunctionDef') {
      const after = nextSibling(child)
      end = after?.name === ';' ? after.to : child.to
    }
  }
  return end === -1
    ? {from: 0, to: 0, insert: `${declaration};\n\n`}
    : {from: end, to: end, insert: `\n${declaration};`}
}

export interface FunctionExtraction {
  id: string
  declaration: string
  /** The expression that becomes the function, as written */
  expression: string
  /** In positions of the query before any of them is made */
  changes: {from: number; to: number; insert: string}[]
  /** Where the call is once the changes are made */
  call: TextRange
}

/** The selection without the whitespace and a separating comma at either end */
function trimSelection(query: string, selection: TextRange): TextRange | null {
  let {from, to} = selection
  const trimWhitespace = () => {
    while (from < to && /\s/.test(query[from])) from++
    while (to > from && /\s/.test(query[to - 1])) to--
  }
  trimWhitespace()
  if (query[to - 1] === ',') to--
  if (query[from] === ',') from++
  trimWhitespace()
  return from < to ? {from, to} : null
}

/** The postfix chain `node` is part of (`author`, `->`, `{name}`), when it is in one */
function chainOf(node: GroqNode): {first: GroqNode; last: GroqNode} | null {
  if (!PRIMARY_NODES.has(node.name) && !POSTFIX_NODES.has(node.name)) return null
  let first = node
  while (POSTFIX_NODES.has(first.name)) {
    const previous = previousSibling(first)
    if (!previous || (!PRIMARY_NODES.has(previous.name) && !POSTFIX_NODES.has(previous.name))) {
      return null
    }
    first = previous
  }
  let last = node
  for (
    let next = nextSibling(last);
    next && POSTFIX_NODES.has(next.name);
    next = nextSibling(last)
  ) {
    last = next
  }
  return {first, last}
}

/**
 * The expressions around a position that end in a projection, innermost first: `author->{name}`
 * for a cursor anywhere in it, a whole `"key": value` pair. The query's top-level expression is
 * left out, since turning all of it into a function is a choice to make with a selection.
 */
function projectionsAround(tree: GroqTree, pos: number): TextRange[] {
  const ranges = new Map<string, TextRange>()
  for (const side of [-1, 1] as const) {
    for (
      let node: GroqNode | null = tree.resolveInner(pos, side);
      node?.parent;
      node = node.parent
    ) {
      if (node.parent.name === 'Query') break
      const chain = node.name === 'PropertyPair' ? null : chainOf(node)
      const range =
        node.name === 'PropertyPair'
          ? {from: node.from, to: node.to}
          : chain?.last.name === 'Projection'
            ? {from: chain.first.from, to: chain.last.to}
            : null
      if (range) ranges.set(`${range.from}:${range.to}`, range)
    }
  }
  return [...ranges.values()].toSorted((a, b) => a.to - a.from - (b.to - b.from))
}

/** The sibling nodes that make up exactly `from`–`to`, with their parent */
function selectedNodes(
  tree: GroqTree,
  from: number,
  to: number,
): {parent: GroqNode; nodes: GroqNode[]} | null {
  let parent: GroqNode | null = tree.resolveInner(from, 1)
  while (parent && (parent.from > from || parent.to < to)) parent = parent.parent
  // The innermost node that covers the selection holds the run, unless the run is that node
  while (parent && parent.from === from && parent.to === to && parent.parent) {
    parent = parent.parent
  }
  if (!parent) return null
  const nodes: GroqNode[] = []
  for (const child of children(parent)) {
    if (child.to <= from || child.from >= to) continue
    if (child.from < from || child.to > to) return null
    nodes.push(child)
  }
  if (nodes.length === 0 || nodes[0].from !== from || nodes[nodes.length - 1].to !== to) return null
  return {parent, nodes}
}

function isIdentifier(text: string): boolean {
  return /^[A-Za-z_]\w*$/.test(text)
}

function dedent(text: string): string {
  const lines = text.split('\n')
  const indents = lines
    .slice(1)
    .filter((line) => line.trim())
    .map((line) => /^\s*/.exec(line)?.[0].length ?? 0)
  const indent = indents.length > 0 ? Math.min(...indents) : 0
  return [
    lines[0],
    ...lines.slice(1).map((line) => line.slice(Math.min(indent, line.length))),
  ].join('\n')
}

function uniqueName(base: string, taken: (candidate: string) => boolean): string {
  if (!taken(base)) return base
  for (let suffix = 2; ; suffix++) {
    if (!taken(`${base}${suffix}`)) return `${base}${suffix}`
  }
}

/** The namespace most of the query's declarations use, else the library's, else `my` */
function pickNamespace(
  declarations: FunctionDeclaration[],
  library: readonly VistaSavedFunction[],
): string {
  const counts = new Map<string, number>()
  for (const declaration of declarations) {
    if (declaration.namespace) {
      counts.set(declaration.namespace, (counts.get(declaration.namespace) ?? 0) + 1)
    }
  }
  let best: string | undefined
  for (const [namespace, count] of counts) {
    if (best === undefined || count > (counts.get(best) ?? 0)) best = namespace
  }
  return best ?? library[0]?.id.split('::')[0] ?? DEFAULT_NAMESPACE
}

/**
 * Turns an expression into a custom function: a projection of something, `author->{name}`,
 * `authors[]->{name}` or `items[]{title}`, becomes a declaration at the top
 * (`fn my::author($author) = $author->{name};`) and a call where it was (`my::author(author)`,
 * keyed like the attribute was when it is a bare entry of a projection). The expression is the
 * selection, or with nothing selected the innermost projection around the cursor. `null` when
 * there is no such expression, or its projection reaches outside itself with `^`.
 */
export function extractFunction(
  query: string,
  selection: TextRange,
  library: readonly VistaSavedFunction[] = [],
): FunctionExtraction | null {
  if (query.length > MAX_EXTRACT_QUERY_LENGTH) return null
  const tree = parseGroq(query)
  if (hasSyntaxErrors(tree)) return null
  if (selection.from === selection.to) {
    for (const range of projectionsAround(tree, selection.from)) {
      const extraction = extractRange(tree, query, range, library)
      if (extraction) return extraction
    }
    return null
  }
  const range = trimSelection(query, selection)
  return range ? extractRange(tree, query, range, library) : null
}

function extractRange(
  tree: GroqTree,
  query: string,
  range: TextRange,
  library: readonly VistaSavedFunction[],
): FunctionExtraction | null {
  let {from} = range
  const {to} = range
  const selected = selectedNodes(tree, from, to)
  if (!selected) return null
  let {parent, nodes} = selected
  for (let node: GroqNode | null = parent; node; node = node.parent) {
    if (node.name === 'FunctionDef') return null
  }
  // A whole `"author": author->{name}` keeps its key; its value is what becomes the function
  if (nodes.length === 1 && nodes[0].name === 'PropertyPair') {
    const pair = nodes[0]
    const pairChildren = children(pair)
    const colon = pairChildren.findIndex((child) => child.name === ':')
    nodes = pairChildren.slice(colon + 1)
    parent = pair
    if (colon === -1 || nodes.length === 0) return null
    from = nodes[0].from
  }

  const last = nodes.length - 1
  if (nodes[last].name !== 'Projection') return null
  let suffixStart = last
  if (nodes[suffixStart - 1]?.name === 'Dereference') suffixStart--
  if (nodes[suffixStart - 1]?.name === 'ArrayTraversal') suffixStart--
  if (suffixStart === 0) return null
  // The argument is one postfix chain (`a + author->{…}` projects `author` alone), and the
  // chain ends with the selection: `authors[]->{name}[0]` indexes every projected author
  const argumentNodes = nodes.slice(0, suffixStart)
  if (
    !PRIMARY_NODES.has(argumentNodes[0].name) ||
    argumentNodes.slice(1).some((node) => !POSTFIX_NODES.has(node.name))
  ) {
    return null
  }
  const following = nextSibling(nodes[last])
  if (following && POSTFIX_NODES.has(following.name)) return null

  const argument = query.slice(from, argumentNodes[argumentNodes.length - 1].to)
  const lastArgumentNode = argumentNodes[argumentNodes.length - 1]
  const attributeNode =
    lastArgumentNode.name === 'DotAccess' || lastArgumentNode.name === 'DerefAccess'
      ? lastArgumentNode.getChild('Identifier')
      : argumentNodes.length === 1 && lastArgumentNode.name === 'Identifier'
        ? lastArgumentNode
        : null
  const attribute = attributeNode ? textOf(query, attributeNode) : undefined
  const before = previousSibling(nodes[0])
  const isBareEntry =
    (parent.name === 'Projection' || parent.name === 'ObjectLiteral') &&
    (before?.name === '{' || before?.name === ',') &&
    (following === null || following.name === ',' || following.name === '}')

  const {declarations} = readQueryFunctions(tree, query)
  const namespace = pickNamespace(declarations, library)
  const takenIds = new Set([
    ...declarations.map((declaration) => declaration.id),
    ...library.map((saved) => saved.id),
    ...GROQ_FUNCTIONS.map((doc) => functionId(doc)),
  ])
  const baseName = attribute && isIdentifier(attribute) ? attribute : 'projection'
  const name = uniqueName(baseName, (candidate) => takenIds.has(`${namespace}::${candidate}`))
  const id = `${namespace}::${name}`
  const suffix = dedent(query.slice(nodes[suffixStart].from, to))
  const parameter = `$${uniqueName(
    attribute && isIdentifier(attribute) ? attribute : 'value',
    (candidate) => new RegExp(`\\$${candidate}(?!\\w)`).test(suffix),
  )}`
  const declaration = `fn ${id}(${parameter}) = ${parameter}${suffix}`
  const key = isBareEntry ? `"${attribute ?? name}": ` : ''
  const callText = `${key}${id}(${argument})`

  const insertion = declarationInsertion(query, declaration)
  // Selecting from the very start of a query without declarations: the declaration goes first
  const changes =
    insertion.from === from
      ? [{from, to, insert: insertion.insert + callText}]
      : [insertion, {from, to, insert: callText}]
  const callFrom = from + insertion.insert.length
  const candidate =
    query.slice(0, insertion.from) +
    insertion.insert +
    query.slice(insertion.to, from) +
    callText +
    query.slice(to)

  // The projection must work as a function body: no `^` out of it, no parameter clash
  const candidateTree = parseGroq(candidate)
  if (hasSyntaxErrors(candidateTree)) return null
  const declarationFrom = insertion.from + (insertion.insert.startsWith('\n') ? 1 : 0)
  const declarationTo = declarationFrom + declaration.length
  const broken = checkFunctions(candidateTree, candidate, library).some(
    (finding) =>
      finding.severity === 'error' &&
      finding.from >= declarationFrom &&
      finding.to <= declarationTo,
  )
  if (broken) return null

  return {
    id,
    declaration,
    expression: query.slice(from, to),
    changes,
    call: {from: callFrom, to: callFrom + callText.length},
  }
}
