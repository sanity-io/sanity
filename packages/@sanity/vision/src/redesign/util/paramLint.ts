import {type Diagnostic, linter} from '@codemirror/lint'
import {Facet, type Extension} from '@codemirror/state'
import {type EditorView} from '@codemirror/view'
import JSON5 from 'json5'

import {type QueryLintFinding, renderMessage} from './groqLint'
import {type ParamFindingTarget} from './schemaCheck'

export type ParamLintTarget = ParamFindingTarget

/** A query lint finding caused by a param's value */
export type ParamLintFinding = QueryLintFinding & {param: ParamLintTarget}

export function isParamLintFinding(finding: QueryLintFinding): finding is ParamLintFinding {
  return finding.param !== undefined
}

/** How the Lint panel names where a param finding is: `type`, `types[1]`, `range.min` */
export function paramLintLabel(target: ParamLintTarget): string {
  let label = target.name
  for (const segment of target.path) {
    label += typeof segment === 'number' ? `[${segment}]` : `.${segment}`
  }
  return label
}

function skipSpace(text: string, start: number): number {
  let i = start
  while (i < text.length) {
    const char = text[i]
    if (char === ' ' || char === '\n' || char === '\r' || char === '\t') {
      i++
    } else if (char === '/' && text[i + 1] === '/') {
      const end = text.indexOf('\n', i)
      i = end === -1 ? text.length : end + 1
    } else if (char === '/' && text[i + 1] === '*') {
      const end = text.indexOf('*/', i + 2)
      i = end === -1 ? text.length : end + 2
    } else {
      break
    }
  }
  return i
}

function stringEnd(text: string, start: number): number {
  const quote = text[start]
  let i = start + 1
  while (i < text.length) {
    if (text[i] === '\\') i += 2
    else if (text[i] === quote) return i + 1
    else i++
  }
  return text.length
}

/** The end of the value that starts at `start` */
function valueEnd(text: string, start: number): number {
  const char = text[start]
  if (char === '"' || char === "'") return stringEnd(text, start)
  if (char === '{' || char === '[') {
    let depth = 0
    let i = start
    while (i < text.length) {
      const current = text[i]
      if (current === '"' || current === "'") {
        i = stringEnd(text, i)
        continue
      }
      if (current === '/' && (text[i + 1] === '/' || text[i + 1] === '*')) {
        i = skipSpace(text, i)
        continue
      }
      if (current === '{' || current === '[') depth++
      else if (current === '}' || current === ']') {
        depth--
        if (depth === 0) return i + 1
      }
      i++
    }
    return text.length
  }
  let i = start
  while (i < text.length && !/[\s,}\]/]/.test(text[i])) i++
  return i
}

function keyAt(text: string, start: number): {key: string; end: number} | null {
  const char = text[start]
  if (char === '"' || char === "'") {
    const end = stringEnd(text, start)
    try {
      const key: unknown = JSON5.parse(text.slice(start, end))
      return typeof key === 'string' ? {key, end} : null
    } catch {
      return null
    }
  }
  const match = /^[A-Za-z_$][\w$]*/.exec(text.slice(start))
  return match ? {key: match[0], end: start + match[0].length} : null
}

function locate(
  text: string,
  start: number,
  path: readonly (string | number)[],
): {from: number; to: number} | null {
  let i = skipSpace(text, start)
  if (i >= text.length) return null
  if (path.length === 0) return {from: i, to: valueEnd(text, i)}
  const [segment, ...rest] = path
  if (typeof segment === 'number') {
    if (text[i] !== '[') return null
    i++
    for (let index = 0; ; index++) {
      i = skipSpace(text, i)
      if (i >= text.length || text[i] === ']') return null
      if (index === segment) return locate(text, i, rest)
      i = skipSpace(text, valueEnd(text, i))
      if (text[i] !== ',') return null
      i++
    }
  }
  if (text[i] !== '{') return null
  i++
  for (;;) {
    i = skipSpace(text, i)
    if (i >= text.length || text[i] === '}') return null
    const key = keyAt(text, i)
    if (!key) return null
    i = skipSpace(text, key.end)
    if (text[i] !== ':') return null
    i = skipSpace(text, i + 1)
    if (key.key === segment) return locate(text, i, rest)
    i = skipSpace(text, valueEnd(text, i))
    if (text[i] !== ',') return null
    i++
  }
}

/**
 * Where the target's value is in the params text, which is JSON5 (comments, single quotes and
 * unquoted keys allowed); `null` when the text does not have it
 */
export function paramValueRange(
  text: string,
  target: Pick<ParamLintTarget, 'name' | 'path'>,
): {from: number; to: number} | null {
  return locate(text, 0, [target.name, ...target.path])
}

/** Whether the params text still holds the value the target found wrong */
function holdsValue(text: string, range: {from: number; to: number}, value: string): boolean {
  try {
    return JSON5.parse(text.slice(range.from, range.to)) === value
  } catch {
    return false
  }
}

/** The params text with the target's suggestion in place of its value; `null` when it cannot be */
export function applyParamSuggestion(
  text: string,
  target: ParamLintTarget,
): {text: string; change: {from: number; to: number; insert: string}} | null {
  if (target.suggestion === undefined) return null
  const range = paramValueRange(text, target)
  if (!range || !holdsValue(text, range, target.value)) return null
  const insert = JSON.stringify(target.suggestion)
  return {
    text: `${text.slice(0, range.from)}${insert}${text.slice(range.to)}`,
    change: {...range, insert},
  }
}

/** A param's value with the target's suggestion in place, as the params form sets it */
export function withParamSuggestion(value: unknown, target: ParamLintTarget): unknown {
  if (target.suggestion === undefined) return value
  const replace = (current: unknown, path: readonly (string | number)[]): unknown => {
    if (path.length === 0) return current === target.value ? target.suggestion : current
    const [segment, ...rest] = path
    if (typeof segment === 'number') {
      return Array.isArray(current)
        ? current.map((item, index) => (index === segment ? replace(item, rest) : item))
        : current
    }
    if (current === null || typeof current !== 'object' || Array.isArray(current)) return current
    const object = current as Record<string, unknown>
    return {...object, [segment]: replace(object[segment], rest)}
  }
  return replace(value, target.path)
}

export interface ParamsLintContext {
  /** The query's lint findings that a param's value causes */
  findings: readonly ParamLintFinding[]
  /** The label of the quick fix writing a suggestion */
  useSuggestion: (suggestion: string) => string
  onApplySuggestion?: () => void
}

const NO_PARAMS_LINT: ParamsLintContext = {findings: [], useSuggestion: (text) => text}

/** The query's findings about param values, for the params JSON editor to underline */
export const paramsLintContext = Facet.define<ParamsLintContext, ParamsLintContext>({
  combine: (values) => values[0] ?? NO_PARAMS_LINT,
})

/**
 * The findings at the values they are about. A value that has changed since the query was linted
 * is not underlined: the finding is about to go away.
 */
export function paramsLintDiagnostics(text: string, context: ParamsLintContext): Diagnostic[] {
  const diagnostics: Diagnostic[] = []
  for (const finding of context.findings) {
    const target = finding.param
    const range = paramValueRange(text, target)
    if (!range || !holdsValue(text, range, target.value)) continue
    const {suggestion} = target
    diagnostics.push({
      from: range.from,
      to: range.to,
      severity: finding.severity,
      message: finding.message,
      renderMessage: () => renderMessage(finding.message),
      source: finding.source,
      ...(suggestion === undefined
        ? {}
        : {
            actions: [
              {
                name: context.useSuggestion(JSON.stringify(suggestion)),
                apply: (view: EditorView, from: number, to: number) => {
                  context.onApplySuggestion?.()
                  view.dispatch({changes: {from, to, insert: JSON.stringify(suggestion)}})
                },
              },
            ],
          }),
    })
  }
  return diagnostics.toSorted((a, b) => a.from - b.from)
}

/** Underlines, in the params JSON editor, the values the query's lint findings are about */
export const paramsJsonLint: Extension = linter(
  (view) => paramsLintDiagnostics(view.state.doc.toString(), view.state.facet(paramsLintContext)),
  {
    delay: 100,
    needsRefresh: (update) =>
      update.startState.facet(paramsLintContext) !== update.state.facet(paramsLintContext),
  },
)
