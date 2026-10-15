import {
  type Diagnostic,
  forEachDiagnostic,
  linter,
  lintKeymap,
  setDiagnosticsEffect,
} from '@codemirror/lint'
import {type EditorState, type Extension} from '@codemirror/state'
import {EditorView, keymap} from '@codemirror/view'

import {functionLibrary, type GroqEditorLabels, groqEditorLabels} from './groqEditorContext'
import {
  checkFunctions,
  declarationInsertion,
  explainDeclarationSyntaxError,
  type FunctionFinding,
  hasSyntaxErrors,
  parseGroq,
} from './groqFunctions'
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

/** `explanation` replaces the parser's message where it says more about the mistake */
export function syntaxErrorDiagnostic(
  error: GroqSyntaxError,
  docLength: number,
  explanation?: string,
): Diagnostic {
  const from = clamp(error.from, 0, docLength)
  return {
    from,
    to: clamp(error.to, from, docLength),
    severity: 'error',
    message: explanation ?? error.message,
    ...(explanation ? {renderMessage: () => renderMessage(explanation)} : {}),
    source: 'groq',
  }
}

/**
 * The checks of custom functions and function calls; an unknown function that the library has
 * comes with an action declaring it
 */
function functionDiagnostics(
  findings: FunctionFinding[],
  labels: GroqEditorLabels | undefined,
): Diagnostic[] {
  return findings.map((finding) => {
    const saved = finding.libraryFunction
    return {
      from: finding.from,
      to: finding.to,
      severity: finding.severity,
      message: finding.message,
      renderMessage: () => renderMessage(finding.message),
      source: `vision/${finding.rule}`,
      ...(saved && labels
        ? {
            actions: [
              {
                name: labels.addFromLibrary,
                apply: (view: EditorView) =>
                  view.dispatch({
                    changes: declarationInsertion(view.state.doc.toString(), saved.declaration),
                  }),
              },
            ],
          }
        : {}),
    }
  })
}

/**
 * The lint source for the query editor: a parse failure becomes one error diagnostic on the
 * offending token, otherwise every `groq-lint` finding gets a diagnostic, and so does every
 * problem with the query's custom functions and function calls. When the wasm cannot be loaded,
 * only the functions are checked, as long as the query parses for the editor's own grammar.
 */
export async function groqLintSource(view: {state: EditorState}): Promise<Diagnostic[]> {
  const {state} = view
  const query = state.doc.toString()
  // CodeMirror lints the initial document too; a blank tab must not load the wasm
  if (!query.trim()) {
    return []
  }
  const tree = parseGroq(query)
  const checkQueryFunctions = () =>
    functionDiagnostics(
      checkFunctions(tree, query, state.facet(functionLibrary)),
      state.facet(groqEditorLabels),
    )
  try {
    const findings = await lintGroq(query)
    return [...toDiagnostics(findings, query.length), ...checkQueryFunctions()].toSorted(
      (a, b) => a.from - b.from || a.to - b.to,
    )
  } catch (error) {
    if (error instanceof GroqSyntaxError) {
      const explanation = explainDeclarationSyntaxError(tree, query, error.from)
      return [syntaxErrorDiagnostic(error, query.length, explanation)]
    }
    return hasSyntaxErrors(tree) ? [] : checkQueryFunctions()
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
    linter(groqLintSource, {
      delay: LINT_DELAY_MS,
      // A function saved to the library or removed from it changes what the query's calls know
      needsRefresh: (update) =>
        update.startState.facet(functionLibrary) !== update.state.facet(functionLibrary),
    }),
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
