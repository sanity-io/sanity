/**
 * A whitespace-only GROQ formatter. It never touches string literals, comments or the token
 * sequence, so the formatted query always means the same thing as the input. Projections and
 * objects with more than one attribute (or nested projections) are expanded to one attribute per
 * line, everything else is collapsed to single spaces.
 */

type OpenBracket = '{' | '[' | '('
type CloseBracket = '}' | ']' | ')'

interface BaseToken {
  /** Whether whitespace preceded this token in the source */
  spaced: boolean
  /** Whether a line break preceded this token in the source */
  newlineBefore: boolean
}

type Token =
  | (BaseToken & {type: 'open'; value: OpenBracket})
  | (BaseToken & {type: 'close'; value: CloseBracket})
  | (BaseToken & {type: 'comma'})
  | (BaseToken & {type: 'comment'; value: string})
  | (BaseToken & {type: 'text'; value: string})

interface Group {
  type: 'group'
  open: OpenBracket
  close: CloseBracket
  children: Node[]
  spaced: boolean
  newlineBefore: boolean
}

type Node = Token | Group

type DistributiveOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never

const INLINE_LIMIT = 60
const INDENT = '  '
const CLOSERS: Record<OpenBracket, CloseBracket> = {'{': '}', '[': ']', '(': ')'}

export class GroqFormatError extends Error {
  override name = 'GroqFormatError'
}

function isWhitespace(char: string): boolean {
  return char === ' ' || char === '\n' || char === '\t' || char === '\r'
}

function tokenize(source: string): Token[] {
  const tokens: Token[] = []
  let spaced = false
  let newlineBefore = false
  let text = ''

  const push = (token: DistributiveOmit<Token, 'spaced' | 'newlineBefore'>) => {
    tokens.push({...token, spaced, newlineBefore} as Token)
    spaced = false
    newlineBefore = false
  }

  const flushText = () => {
    if (text) {
      push({type: 'text', value: text})
      text = ''
    }
  }

  let i = 0
  while (i < source.length) {
    const char = source[i]

    if (isWhitespace(char)) {
      flushText()
      spaced = true
      if (char === '\n') newlineBefore = true
      i++
      continue
    }

    if (char === '"' || char === "'") {
      const end = findStringEnd(source, i)
      text += source.slice(i, end)
      i = end
      continue
    }

    if (char === '/' && source[i + 1] === '/') {
      flushText()
      let end = source.indexOf('\n', i)
      if (end === -1) end = source.length
      push({type: 'comment', value: source.slice(i, end).trimEnd()})
      i = end
      continue
    }

    if (char === '{' || char === '[' || char === '(') {
      flushText()
      push({type: 'open', value: char})
      i++
      continue
    }

    if (char === '}' || char === ']' || char === ')') {
      flushText()
      push({type: 'close', value: char})
      i++
      continue
    }

    if (char === ',') {
      flushText()
      push({type: 'comma'})
      i++
      continue
    }

    text += char
    i++
  }

  flushText()
  return tokens
}

function findStringEnd(source: string, start: number): number {
  const quote = source[start]
  let i = start + 1
  while (i < source.length) {
    if (source[i] === '\\') {
      i += 2
      continue
    }
    if (source[i] === quote) {
      return i + 1
    }
    i++
  }
  throw new GroqFormatError('Unterminated string literal')
}

function buildTree(tokens: Token[]): Node[] {
  const root: Node[] = []
  const stack: Group[] = []
  const current = () => (stack.length ? stack[stack.length - 1].children : root)

  for (const token of tokens) {
    if (token.type === 'open') {
      const group: Group = {
        type: 'group',
        open: token.value,
        close: CLOSERS[token.value],
        children: [],
        spaced: token.spaced,
        newlineBefore: token.newlineBefore,
      }
      current().push(group)
      stack.push(group)
      continue
    }
    if (token.type === 'close') {
      const group = stack.pop()
      if (!group || group.close !== token.value) {
        throw new GroqFormatError(`Unexpected "${token.value}"`)
      }
      continue
    }
    current().push(token)
  }

  if (stack.length > 0) {
    throw new GroqFormatError(`Missing "${stack[stack.length - 1].close}"`)
  }
  return root
}

function hasComment(nodes: Node[]): boolean {
  return nodes.some((node) => node.type === 'comment')
}

function shouldExpand(group: Group): boolean {
  if (hasComment(group.children)) {
    return true
  }
  const expandedChild = group.children.some((node) => node.type === 'group' && shouldExpand(node))
  if (group.open !== '{') {
    return expandedChild
  }
  const hasComma = group.children.some((node) => node.type === 'comma')
  return expandedChild || hasComma || renderInline(group.children).length > INLINE_LIMIT
}

/** Whether to put a space between `previous` and `next` when rendering inline */
function needsSpace(previous: Node | undefined, next: Node): boolean {
  if (!previous) return false
  if (next.type === 'comma') return false
  if (previous.type === 'comma') return true
  return next.spaced
}

function renderInline(nodes: Node[]): string {
  let output = ''
  let previous: Node | undefined
  for (const node of nodes) {
    if (needsSpace(previous, node)) {
      output += ' '
    }
    output += renderNode(node, 0, false)
    previous = node
  }
  return output
}

function renderNode(node: Node, depth: number, allowExpand: boolean): string {
  switch (node.type) {
    case 'text':
      return node.value
    case 'comment':
      return node.value
    case 'comma':
      return ','
    case 'group':
      return renderGroup(node, depth, allowExpand)
    default:
      return ''
  }
}

function renderGroup(group: Group, depth: number, allowExpand: boolean): string {
  if (!allowExpand || !shouldExpand(group)) {
    return `${group.open}${renderInline(group.children)}${group.close}`
  }

  const innerIndent = INDENT.repeat(depth + 1)
  let line = ''
  let openSuffix = ''
  const lines: string[] = []
  let previous: Node | undefined

  const pushLine = () => {
    if (line.trim()) {
      lines.push(`${innerIndent}${line.trimEnd()}`)
    }
    line = ''
    previous = undefined
  }

  for (const node of group.children) {
    if (node.type === 'comma') {
      line += ','
      pushLine()
      continue
    }
    if (node.type === 'comment') {
      if (line.trim()) {
        line += ` ${node.value}`
      } else if (!node.newlineBefore && lines.length > 0) {
        // A comment on the same source line as the previous attribute stays with it
        lines[lines.length - 1] += ` ${node.value}`
        continue
      } else if (!node.newlineBefore && lines.length === 0 && !openSuffix) {
        // ...and one right after the opening bracket stays on that line
        openSuffix = ` ${node.value}`
        continue
      } else {
        line += node.value
      }
      pushLine()
      continue
    }
    if (needsSpace(previous, node)) {
      line += ' '
    }
    line += renderNode(node, depth + 1, true)
    previous = node
  }
  pushLine()

  return `${group.open}${openSuffix}\n${lines.join('\n')}\n${INDENT.repeat(depth)}${group.close}`
}

/**
 * Formats a GROQ query. Throws {@link GroqFormatError} for unbalanced brackets or unterminated
 * strings, in which case the query is left as it is.
 */
export function formatGroq(query: string): string {
  const tree = buildTree(tokenize(query))
  const lines: string[] = []
  let line = ''
  let previous: Node | undefined

  for (const node of tree) {
    if (node.type === 'comment') {
      if (line.trim()) {
        lines.push(`${line.trimEnd()} ${node.value}`)
      } else if (!node.newlineBefore && lines.length > 0) {
        lines[lines.length - 1] += ` ${node.value}`
      } else {
        lines.push(node.value)
      }
      line = ''
      previous = undefined
      continue
    }
    if (needsSpace(previous, node)) {
      line += ' '
    }
    line += renderNode(node, 0, true)
    previous = node
  }
  if (line.trim()) {
    lines.push(line.trimEnd())
  }

  return lines.join('\n')
}
