import {
  type Diagnostic,
  forEachDiagnostic,
  linter,
  lintKeymap,
  setDiagnosticsEffect,
} from '@codemirror/lint'
import {type EditorState, type Extension} from '@codemirror/state'
import {EditorView, keymap} from '@codemirror/view'

import {type GroqFinding, GroqSyntaxError, lintGroq} from './groqWasm'

/** Idle time after an edit before the query is linted again */
const LINT_DELAY_MS = 500

export type LintSeverity = Diagnostic['severity']

/** A diagnostic of the query editor, positioned for a list outside the editor */
export interface QueryLintFinding {
  from: number
  to: number
  /** 1-based, like the editor's gutter */
  line: number
  /** 1-based column of `from` */
  column: number
  severity: LintSeverity
  message: string
  /** `groq-lint/<rule>`, or `groq` for a query that does not parse */
  source: string | undefined
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Rule messages quote GROQ in backticks, markdown style: the segments of a message, in order,
 * with the quoted ones marked as code.
 */
export function splitMessage(message: string): {text: string; code: boolean}[] {
  return message
    .split('`')
    .map((text, index) => ({text, code: index % 2 === 1}))
    .filter((segment) => segment.text !== '')
}

/** Renders {@link splitMessage} for the editor's tooltips and lint panel */
export function renderMessage(message: string): DocumentFragment {
  const fragment = document.createDocumentFragment()
  for (const segment of splitMessage(message)) {
    if (segment.code) {
      const code = document.createElement('code')
      code.textContent = segment.text
      fragment.append(code)
    } else {
      fragment.append(segment.text)
    }
  }
  return fragment
}

/** Maps `groq-lint` findings onto the document, dropping any range the wasm reported past its end */
export function toDiagnostics(findings: GroqFinding[], docLength: number): Diagnostic[] {
  return findings.map((finding) => {
    const from = clamp(finding.from, 0, docLength)
    return {
      from,
      to: clamp(finding.to, from, docLength),
      severity: finding.severity,
      message: finding.message,
      renderMessage: () => renderMessage(finding.message),
      source: `groq-lint/${finding.ruleId}`,
    }
  })
}

export function syntaxErrorDiagnostic(error: GroqSyntaxError, docLength: number): Diagnostic {
  const from = clamp(error.from, 0, docLength)
  return {
    from,
    to: clamp(error.to, from, docLength),
    severity: 'error',
    message: error.message,
    source: 'groq',
  }
}

/**
 * The lint source for the query editor: a parse failure becomes one error diagnostic on the
 * offending token, otherwise every `groq-lint` finding gets a diagnostic. When the wasm cannot be
 * loaded the editor simply stays without diagnostics.
 */
export async function groqLintSource(view: {state: EditorState}): Promise<Diagnostic[]> {
  const query = view.state.doc.toString()
  // CodeMirror lints the initial document too; a blank tab must not load the wasm
  if (!query.trim()) {
    return []
  }
  try {
    return toDiagnostics(await lintGroq(query), query.length)
  } catch (error) {
    return error instanceof GroqSyntaxError ? [syntaxErrorDiagnostic(error, query.length)] : []
  }
}

/** The editor's current diagnostics, at their positions in the current document */
export function collectFindings(state: EditorState): QueryLintFinding[] {
  const findings: QueryLintFinding[] = []
  forEachDiagnostic(state, (diagnostic, from, to) => {
    const line = state.doc.lineAt(from)
    findings.push({
      from,
      to,
      line: line.number,
      column: from - line.from + 1,
      severity: diagnostic.severity,
      message: diagnostic.message,
      source: diagnostic.source,
    })
  })
  return findings
}

/**
 * Underlines problems while typing; F8 jumps between them and Mod-Shift-m lists them inside the
 * editor. `onFindings` receives the diagnostics whenever they are recomputed or move with an
 * edit, for the Lint panel outside the editor.
 */
export function createGroqLintExtensions(
  onFindings: (findings: QueryLintFinding[]) => void,
): Extension[] {
  return [
    linter(groqLintSource, {delay: LINT_DELAY_MS}),
    keymap.of(lintKeymap),
    EditorView.updateListener.of((update) => {
      const recomputed = update.transactions.some((transaction) =>
        transaction.effects.some((effect) => effect.is(setDiagnosticsEffect)),
      )
      if (recomputed || update.docChanged) {
        onFindings(collectFindings(update.state))
      }
    }),
  ]
}
