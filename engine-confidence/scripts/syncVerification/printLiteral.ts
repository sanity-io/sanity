const LINE_WIDTH = 100
const INDENT = 2
const IDENTIFIER = /^[A-Za-z_$][\w$]*$/

function isContainer(value: unknown): value is object {
  return typeof value === 'object' && value !== null
}

function quote(text: string): string {
  const escaped = JSON.stringify(text)
    .slice(1, -1)
    .replaceAll('\\"', '"')
    .replaceAll("'", "\\'")
    .replaceAll('\u2028', '\\u2028')
    .replaceAll('\u2029', '\\u2029')
  return `'${escaped}'`
}

function keyOf(name: string): string {
  return IDENTIFIER.test(name) ? name : quote(name)
}

function childrenOf(value: object): Array<[string | undefined, unknown]> {
  return Array.isArray(value)
    ? value.map((item): [undefined, unknown] => [undefined, item])
    : Object.entries(value)
}

function labelled(name: string | undefined, text: string): string {
  return name === undefined ? text : `${keyOf(name)}: ${text}`
}

function flat(value: unknown): string {
  if (typeof value === 'string') return quote(value)
  if (!isContainer(value)) return JSON.stringify(value)
  const body = childrenOf(value)
    .map(([name, child]) => labelled(name, flat(child)))
    .join(', ')
  return Array.isArray(value) ? `[${body}]` : `{${body}}`
}

function render(value: unknown, indent: number, lead: number): string {
  if (!isContainer(value)) return flat(value)
  const children = childrenOf(value)
  const text = flat(value)
  const holdsContainers = children.some(([, child]) => isContainer(child))
  if (!holdsContainers || indent + lead + text.length <= LINE_WIDTH) return text
  const inner = indent + INDENT
  const lines = children.map(([name, child]) => {
    const prefix = name === undefined ? '' : `${keyOf(name)}: `
    return `${' '.repeat(inner)}${prefix}${render(child, inner, prefix.length)},`
  })
  const [open, close] = Array.isArray(value) ? ['[', ']'] : ['{', '}']
  return [open, ...lines, `${' '.repeat(indent)}${close}`].join('\n')
}

/** Prints JSON-compatible data as a TypeScript literal: single quotes, bare keys, short values on one line. */
export function printLiteral(value: unknown): string {
  return render(value, 0, 0)
}
