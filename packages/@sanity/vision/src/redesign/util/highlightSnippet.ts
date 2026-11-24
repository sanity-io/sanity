import {javascriptLanguage} from '@codemirror/lang-javascript'
import {type TagStyle} from '@codemirror/language'
import {type Highlighter, highlightTree, type Tag, tagHighlighter, tags} from '@lezer/highlight'
import {groqLanguage} from '@sanity/lezer-groq'

import {type ExportSnippetFile} from './exportSnippets'

/** A run of a snippet's text, styled by the spec at `style` in the list it was highlighted with */
export interface HighlightSpan {
  text: string
  style: number | undefined
}

interface StyledRange {
  from: number
  to: number
  style: number
}

interface Region {
  from: number
  to: number
}

const highlighters = new WeakMap<readonly TagStyle[], Highlighter>()

/** Tags each node with the index of the first spec that styles it, which is how the editors pick */
export function getHighlighter(specs: readonly TagStyle[]): Highlighter {
  let highlighter = highlighters.get(specs)
  if (!highlighter) {
    highlighter = tagHighlighter(
      specs.flatMap((spec, index) =>
        (Array.isArray(spec.tag) ? spec.tag : [spec.tag]).map((tag: Tag) => ({
          tag,
          class: String(index),
        })),
      ),
    )
    highlighters.set(specs, highlighter)
  }
  return highlighter
}

function toStyle(classes: string): number | undefined {
  const index = Number.parseInt(classes, 10)
  return Number.isNaN(index) ? undefined : index
}

const jsParsers = {
  javascript: javascriptLanguage.parser,
  typescript: javascriptLanguage.parser.configure({dialect: 'ts'}),
  jsx: javascriptLanguage.parser.configure({dialect: 'jsx ts'}),
}

type JsDialect = keyof typeof jsParsers

/** `AUTHOR_QUERY`, `QUERY`: the constants the snippets keep their queries in */
const QUERY_CONSTANT = /(?:^|_)QUERY$/

/**
 * Highlights the JavaScript between `from` and `to`, and the GROQ in each query it holds: a
 * template literal assigned to a query constant or passed to `defineQuery`, the way editors
 * highlight GROQ embedded in code
 */
function highlightJs(
  code: string,
  from: number,
  to: number,
  dialect: JsDialect,
  highlighter: Highlighter,
  ranges: StyledRange[],
  queries: Region[],
): void {
  const text = code.slice(from, to)
  const tree = jsParsers[dialect].parse(text)
  tree.iterate({
    enter(node) {
      if (node.name !== 'TemplateString') return undefined
      const parent = node.node.parent
      const isQuery =
        (parent?.name === 'VariableDeclaration' &&
          node.node.prevSibling?.prevSibling?.name === 'VariableDefinition' &&
          QUERY_CONSTANT.test(
            text.slice(
              node.node.prevSibling.prevSibling.from,
              node.node.prevSibling.prevSibling.to,
            ),
          )) ||
        (parent?.name === 'ArgList' &&
          parent.parent?.name === 'CallExpression' &&
          parent.parent.firstChild !== null &&
          text.slice(parent.parent.firstChild.from, parent.parent.firstChild.to) === 'defineQuery')
      // The backticks stay JavaScript
      if (isQuery && node.to - node.from >= 2) {
        queries.push({from: from + node.from + 1, to: from + node.to - 1})
      }
      return false
    },
  })
  highlightTree(tree, highlighter, (start, end, classes) => {
    const style = toStyle(classes)
    if (style !== undefined) ranges.push({from: from + start, to: from + end, style})
  })
}

function highlightGroq(
  code: string,
  region: Region,
  highlighter: Highlighter,
  ranges: StyledRange[],
): void {
  const tree = groqLanguage.parser.parse(code.slice(region.from, region.to))
  highlightTree(tree, highlighter, (start, end, classes) => {
    const style = toStyle(classes)
    if (style !== undefined) {
      ranges.push({from: region.from + start, to: region.from + end, style})
    }
  })
}

/** `curl 'url' --data-urlencode 'query=…' -H "Authorization: Bearer $SANITY_API_TOKEN"` */
const SHELL_TOKEN =
  /'(?:[^']|'\\'')*'|"(?:[^"\\]|\\.)*"|(?<=^|\s)-{1,2}[A-Za-z][\w-]*|\\(?=\n)|(?<=^|\n)curl\b/g
const SHELL_VARIABLE = /\$[A-Za-z_]\w*/g
const QUERY_ARGUMENT = "'query="

/**
 * Highlights a curl command: its strings, options and variables, and the GROQ of a query sent in
 * the URL. A query in a JSON body is left a string: there it is escaped JSON, not GROQ as written.
 */
function highlightCurl(
  code: string,
  highlighter: Highlighter,
  ranges: StyledRange[],
  queries: Region[],
): void {
  const styleOf = (tag: Tag) => toStyle(highlighter.style([tag]) ?? '')
  const push = (from: number, to: number, tag: Tag) => {
    const style = styleOf(tag)
    if (style !== undefined && to > from) ranges.push({from, to, style})
  }
  for (const match of code.matchAll(SHELL_TOKEN)) {
    const token = match[0]
    const from = match.index
    const to = from + token.length
    if (token === 'curl') push(from, to, tags.keyword)
    else if (token === '\\') push(from, to, tags.comment)
    else if (token.startsWith('-')) push(from, to, tags.propertyName)
    else if (token.startsWith('"')) {
      push(from, to, tags.string)
      for (const variable of token.matchAll(SHELL_VARIABLE)) {
        const start = from + variable.index
        push(start, start + variable[0].length, tags.special(tags.variableName))
      }
    } else if (token.startsWith(QUERY_ARGUMENT) && !token.includes("'\\''")) {
      // A quote inside the query closes and reopens the shell string, which GROQ cannot read
      push(from, from + QUERY_ARGUMENT.length, tags.string)
      queries.push({from: from + QUERY_ARGUMENT.length, to: to - 1})
      push(to - 1, to, tags.string)
    } else push(from, to, tags.string)
  }
}

const FRONTMATTER = /^---\n([\s\S]*?)\n---$/m
const VUE_SCRIPT = /^<script\b[^>]*>\n([\s\S]*?)\n<\/script>$/m

/** The parts of a file that are script, and the markup around them */
function jsSegments(file: ExportSnippetFile): {from: number; to: number; dialect: JsDialect}[] {
  const {code, path = '', language} = file
  const embedded = path.endsWith('.astro')
    ? FRONTMATTER.exec(code)
    : path.endsWith('.vue')
      ? VUE_SCRIPT.exec(code)
      : null
  if (embedded) {
    const scriptFrom = embedded.index + embedded[0].indexOf('\n') + 1
    const scriptTo = scriptFrom + embedded[1].length
    return [
      {from: 0, to: scriptFrom, dialect: 'jsx'},
      {from: scriptFrom, to: scriptTo, dialect: 'typescript'},
      {from: scriptTo, to: code.length, dialect: 'jsx'},
    ]
  }
  const dialect: JsDialect =
    language === 'jsx' ? 'jsx' : language === 'typescript' ? 'typescript' : 'javascript'
  return [{from: 0, to: code.length, dialect}]
}

/** Takes what the queries cover out of a range, which their GROQ highlighting styles instead */
function outsideQueries(range: StyledRange, queries: Region[]): StyledRange[] {
  let pieces = [range]
  for (const query of queries) {
    pieces = pieces.flatMap((piece) => {
      if (piece.to <= query.from || piece.from >= query.to) return [piece]
      return [
        {...piece, to: query.from},
        {...piece, from: query.to},
      ].filter((rest) => rest.to > rest.from)
    })
  }
  return pieces
}

/**
 * Splits a snippet file into styled runs for display, with the GROQ of its queries highlighted
 * as GROQ. The runs join back into the file's code exactly.
 */
export function highlightSnippet(
  file: ExportSnippetFile,
  specs: readonly TagStyle[],
): HighlightSpan[] {
  const {code} = file
  const highlighter = getHighlighter(specs)
  const outer: StyledRange[] = []
  const queries: Region[] = []
  if (file.language === 'bash') {
    highlightCurl(code, highlighter, outer, queries)
  } else {
    for (const segment of jsSegments(file)) {
      highlightJs(code, segment.from, segment.to, segment.dialect, highlighter, outer, queries)
    }
  }

  const inner: StyledRange[] = []
  for (const query of queries) highlightGroq(code, query, highlighter, inner)
  const ranges = [...outer.flatMap((range) => outsideQueries(range, queries)), ...inner].sort(
    (a, b) => a.from - b.from,
  )

  const spans: HighlightSpan[] = []
  let position = 0
  for (const range of ranges) {
    // Highlighters never overlap within a tree, but stay safe if two parses ever would
    const from = Math.max(range.from, position)
    if (range.to <= from) continue
    if (from > position) spans.push({text: code.slice(position, from), style: undefined})
    spans.push({text: code.slice(from, range.to), style: range.style})
    position = range.to
  }
  if (position < code.length) spans.push({text: code.slice(position), style: undefined})
  return spans
}
