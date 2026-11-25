import {
  autocompletion,
  type Completion,
  type CompletionContext,
  type CompletionResult,
} from '@codemirror/autocomplete'
import {Facet, type Extension} from '@codemirror/state'
import {type EditorView} from '@codemirror/view'
import {type ExprNode, parse} from 'groq-js'

import {type InferredParam, type ParamType} from './paramInference'
import {isQueryParamName} from './queryParamName'

/** The params the query uses, as the params form and the TS/Zod export infer them */
const NO_INFERRED_PARAMS: readonly InferredParam[] = []

export const paramsJsonInferredParams = Facet.define<
  readonly InferredParam[],
  readonly InferredParam[]
>({
  combine: (values) => values[0] ?? NO_INFERRED_PARAMS,
})

type Token =
  | {type: 'punct'; char: string; from: number}
  | {type: 'string'; value: string; from: number; closed: boolean}
  | {type: 'word'; text: string; from: number}

const WORD_CHAR = /[\w$.+-]/

/** The JSON5 tokens of `text`, comments skipped; the last one may be unfinished */
function tokenize(text: string): Token[] {
  const tokens: Token[] = []
  let index = 0
  while (index < text.length) {
    const char = text[index]
    if (char === '/' && text[index + 1] === '/') {
      const end = text.indexOf('\n', index)
      index = end === -1 ? text.length : end
    } else if (char === '/' && text[index + 1] === '*') {
      const end = text.indexOf('*/', index + 2)
      index = end === -1 ? text.length : end + 2
    } else if (char === '"' || char === "'") {
      let end = index + 1
      let value = ''
      while (end < text.length && text[end] !== char) {
        if (text[end] === '\\') {
          value += text[end + 1] ?? ''
          end += 2
        } else {
          value += text[end]
          end++
        }
      }
      const closed = end < text.length
      tokens.push({type: 'string', value, from: index, closed})
      index = closed ? end + 1 : text.length
    } else if ('{}[]:,'.includes(char)) {
      tokens.push({type: 'punct', char, from: index})
      index++
    } else if (WORD_CHAR.test(char)) {
      let end = index + 1
      while (end < text.length && WORD_CHAR.test(text[end])) end++
      tokens.push({type: 'word', text: text.slice(index, end), from: index})
      index = end
    } else {
      index++
    }
  }
  return tokens
}

function keyOf(token: Token | undefined): string | undefined {
  if (token?.type === 'string' && token.closed) return token.value
  if (token?.type === 'word') return token.text
  return undefined
}

/** The keys of the root object, read from its tokens so a document mid-edit still has them */
function rootKeys(tokens: Token[]): Set<string> {
  const keys = new Set<string>()
  let depth = 0
  tokens.forEach((token, index) => {
    if (token.type !== 'punct') return
    if (token.char === '{' || token.char === '[') depth++
    else if (token.char === '}' || token.char === ']') depth--
    else if (token.char === ':' && depth === 1) {
      const key = keyOf(tokens[index - 1])
      if (key !== undefined) keys.add(key)
    }
  })
  return keys
}

/** Whether the tokens leave the cursor directly inside the root object, outside any value in it */
function inRootObject(tokens: Token[]): boolean {
  const stack: string[] = []
  for (const token of tokens) {
    if (token.type !== 'punct') continue
    if (token.char === '{' || token.char === '[') stack.push(token.char)
    else if (token.char === '}' || token.char === ']') stack.pop()
  }
  return stack.length === 1 && stack[0] === '{'
}

type Literal = string | number | boolean

function literalValues(node: ExprNode): Literal[] {
  if (node.type === 'Value') {
    const {value} = node
    return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
      ? [value]
      : []
  }
  if (node.type === 'Array') {
    return node.elements.flatMap((element) =>
      element.isSplat ? [] : literalValues(element.value).slice(0, 1),
    )
  }
  return []
}

function fitsKind(value: Literal, type: ParamType): boolean {
  switch (type.kind) {
    case 'string':
      return typeof value === 'string'
    case 'number':
      return typeof value === 'number'
    case 'integer':
      return typeof value === 'number' && Number.isInteger(value)
    case 'boolean':
      return typeof value === 'boolean'
    case 'any':
      return true
    default: {
      const unhandled: never = type.kind
      return unhandled
    }
  }
}

/**
 * The literals the query compares a param with, read from its usages: `$kind == "a"`,
 * `"b" != $kind`, `$kind in ["a", "b"]`. Only those of the param's inferred kind.
 */
function comparedLiterals(param: InferredParam): Literal[] {
  const isParam = (node: ExprNode) => node.type === 'Parameter' && node.name === param.name
  const values: Literal[] = []
  for (const usage of param.usages) {
    let node: ExprNode
    try {
      node = parse(usage)
    } catch {
      continue
    }
    if (node.type !== 'OpCall') continue
    const {op, left, right} = node
    if (op === '==' || op === '!=') {
      if (isParam(left) && right.type === 'Value') values.push(...literalValues(right))
      if (isParam(right) && left.type === 'Value') values.push(...literalValues(left))
    } else if (op === 'in' && isParam(left)) {
      values.push(...literalValues(right))
    }
  }
  return [...new Set(values)].filter((value) => fitsKind(value, param.type))
}

/**
 * A value the query accepts for a param, or `null` when nothing better is known: the first value
 * the schema allows, an empty string, zero, `false` or an empty list. A date and time is now.
 */
export function suggestedParamValue(type: ParamType, now: () => Date = () => new Date()): unknown {
  if (type.array) return type.kind === 'any' ? null : []
  switch (type.kind) {
    case 'string':
      if (type.options && type.options.length > 0) return type.options[0]
      return type.format === 'datetime' ? now().toISOString() : ''
    case 'number':
    case 'integer':
      return 0
    case 'boolean':
      return false
    case 'any':
      return null
    default: {
      const unhandled: never = type.kind
      return unhandled
    }
  }
}

/** The value accepting a param's key writes: a schema option, else a compared literal, else a typed default */
function defaultParamValue(param: InferredParam, now?: () => Date): unknown {
  const {type} = param
  if (!type.array && !type.options?.length) {
    const [literal] = comparedLiterals(param)
    if (literal !== undefined) return literal
  }
  return suggestedParamValue(type, now)
}

/** Every value worth offering for a param, the one its key writes first */
export function paramValueOptions(param: InferredParam, now?: () => Date): unknown[] {
  const {type} = param
  const values: unknown[] = [defaultParamValue(param, now)]
  if (!type.array && type.kind === 'string' && type.options) values.push(...type.options)
  if (!type.array) values.push(...comparedLiterals(param))
  if (!type.array && type.kind === 'boolean') values.push(true)
  if (param.nullable) values.push(null)
  const seen = new Set<string>()
  return values.filter((value) => {
    const json = JSON.stringify(value)
    if (seen.has(json)) return false
    seen.add(json)
    return true
  })
}

/** The first character after `pos` that is not whitespace or a comment */
function nextSignificant(text: string, pos: number): string | undefined {
  const rest = text.slice(pos).replace(/^(?:\s|\/\/[^\n]*|\/\*[\s\S]*?\*\/)*/, '')
  return rest[0]
}

/** Replaces `from`–`to` with `insert` and leaves the cursor after it */
function replaceWith(insert: string, from: number, to: number) {
  return (view: EditorView) => {
    view.dispatch({
      changes: {from, to, insert},
      selection: {anchor: from + insert.length},
      userEvent: 'input.complete',
    })
  }
}

/**
 * Completes the params JSON with what the query uses. A key position offers the params the query
 * references that the JSON has no key for yet, and accepting one writes `"name": value` with a
 * value the query accepts (`null` when none is known). Right after `"name":`, the values the query
 * accepts for that param are offered.
 */
export function paramsJsonCompletions(
  context: CompletionContext,
  now?: () => Date,
): CompletionResult | null {
  const params = context.state.facet(paramsJsonInferredParams)
  if (params.length === 0) return null
  const doc = context.state.doc.toString()
  const before = doc.slice(0, context.pos)
  const tokens = tokenize(before)
  const last = tokens.at(-1)
  const current =
    (last?.type === 'string' && !last.closed) ||
    (last?.type === 'word' && last.from + last.text.length === context.pos)
      ? last
      : undefined
  const preceding = current ? tokens.slice(0, -1) : tokens
  const previous = preceding.at(-1)
  if (previous?.type !== 'punct') return null
  // Typing the colon after a key offers its values; a key waits for its first character
  if (!current && !context.explicit && previous.char !== ':') return null
  if (!inRootObject(preceding)) return null

  const from = current?.from ?? context.pos
  // closeBrackets writes the closing quote with the opening one. Accepting replaces that quote
  // too, so the inserted value does not sit inside the empty string. The match ends at the
  // cursor: including the closing quote makes the filter text `""`, which matches no option.
  const replaceTo =
    current?.type === 'string' && doc[context.pos] === doc[current.from]
      ? context.pos + 1
      : context.pos
  // Nothing typed between the quotes. An explicit request matches every option; filtering on the
  // opening quote alone would hide every value that is not itself a string.
  const emptyString =
    current?.type === 'string' &&
    context.pos === current.from + 1 &&
    (doc[context.pos] === doc[current.from] || context.pos === doc.length)
  const matchAll = emptyString && context.explicit
  // A quoted key is matched on the text inside the quotes. An explicit request in an empty
  // string matches every option, so the match is empty.
  let matchFrom = from
  if (matchAll) matchFrom = context.pos
  else if (current?.type === 'string') matchFrom = from + 1

  if (previous.char === '{' || previous.char === ',') {
    const existing = rootKeys(preceding)
    const missing = params.filter(
      (param) => isQueryParamName(param.name) && !existing.has(param.name),
    )
    if (missing.length === 0) return null
    const next = nextSignificant(doc, replaceTo)
    const separator = next === undefined || next === '}' || next === ',' ? '' : ','
    const options = missing.map((param, index): Completion => {
      const value = JSON.stringify(defaultParamValue(param, now))
      return {
        label: param.name,
        detail: value,
        type: 'property',
        boost: -index,
        apply: replaceWith(`${JSON.stringify(param.name)}: ${value}${separator}`, from, replaceTo),
      }
    })
    return {from: matchFrom, to: context.pos, options}
  }

  if (previous.char === ':') {
    const name = keyOf(preceding.at(-2))
    const param = params.find((it) => it.name === name)
    if (!param) return null
    const options = paramValueOptions(param, now).map((value, index): Completion => {
      const json = JSON.stringify(value)
      return {
        label: json,
        type: 'constant',
        boost: -index,
        apply: replaceWith(json, from, replaceTo),
      }
    })
    // A value's label is its JSON, so the opening quote is part of the match. An explicit
    // request in an empty string matches every value, strings or not.
    if (current?.type === 'string' && !matchAll) matchFrom = from
    return {from: matchFrom, to: context.pos, options}
  }

  return null
}

/** Autocompletion for the params JSON editor; Enter accepts the highlighted completion */
export const paramsJsonAutocompletion: Extension = autocompletion({
  override: [(context) => paramsJsonCompletions(context)],
  icons: false,
})
