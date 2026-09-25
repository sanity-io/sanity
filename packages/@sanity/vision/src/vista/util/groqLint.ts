import {type Diagnostic, linter, lintKeymap} from '@codemirror/lint'
import {type EditorState, type Extension} from '@codemirror/state'
import {keymap} from '@codemirror/view'

import {type GroqFinding, GroqSyntaxError, lintGroq} from './groqWasm'

/** Idle time after an edit before the query is linted again */
const LINT_DELAY_MS = 500

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Rule messages quote GROQ in backticks, markdown style; the odd segments of a split on them are
 * the quoted code. Rendered as `<code>` elements for the tooltip and the lint panel.
 */
export function renderMessage(message: string): DocumentFragment {
  const fragment = document.createDocumentFragment()
  message.split('`').forEach((segment, index) => {
    if (!segment) return
    if (index % 2 === 0) {
      fragment.append(segment)
    } else {
      const code = document.createElement('code')
      code.textContent = segment
      fragment.append(code)
    }
  })
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
  try {
    return toDiagnostics(await lintGroq(query), query.length)
  } catch (error) {
    return error instanceof GroqSyntaxError ? [syntaxErrorDiagnostic(error, query.length)] : []
  }
}

/** Underlines problems while typing; F8 jumps between them and Mod-Shift-m lists them */
export const groqLintExtensions: Extension[] = [
  linter(groqLintSource, {delay: LINT_DELAY_MS}),
  keymap.of(lintKeymap),
]
