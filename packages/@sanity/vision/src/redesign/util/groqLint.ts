import {
  type Diagnostic,
  forEachDiagnostic,
  linter,
  lintKeymap,
  setDiagnosticsEffect,
} from '@codemirror/lint'
import {type EditorState, type Extension} from '@codemirror/state'
import {EditorView, keymap} from '@codemirror/view'

import {
  functionLibrary,
  type GroqEditorLabels,
  groqEditorLabels,
  queryParamValues,
  querySchema,
} from './groqEditorContext'
import {
  checkFunctions,
  declarationInsertion,
  explainDeclarationSyntaxError,
  type FunctionFinding,
  type GroqTree,
  hasSyntaxErrors,
  parseGroq,
} from './groqFunctions'
import {type GroqFinding, GroqSyntaxError, lintGroq} from './groqWasm'
import {checkQuerySchema, type ParamFindingTarget, type SchemaFinding} from './schemaCheck'

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
  /** Set when a param's value causes the finding: it is fixed in the params, not the query */
  param?: ParamFindingTarget
  /** The edit of the query that the finding's quick fix makes, when it has one */
  fix?: {from: number; to: number; insert: string}
}

/** Marks the query's diagnostics that a param's value causes, which the query editor underlines lightly */
export const PARAM_LINT_MARK_CLASS = 'cm-vision-paramLint'

/**
 * What the Lint panel needs from a diagnostic that CodeMirror does not keep: the param it is
 * about, or the query edit of its quick fix, relative to the diagnostic's start (edits move it)
 */
const diagnosticTargets = new WeakMap<
  Diagnostic,
  {param?: ParamFindingTarget; fix?: {from: number; to: number; insert: string}}
>()

const SEVERITY_RANK: Record<LintSeverity, number> = {error: 3, warning: 2, info: 1, hint: 0}

/** The most severe of the findings, or `undefined` when there are none */
export function worstSeverity(findings: QueryLintFinding[]): LintSeverity | undefined {
  let worst: LintSeverity | undefined
  for (const {severity} of findings) {
    if (worst === undefined || SEVERITY_RANK[severity] > SEVERITY_RANK[worst]) {
      worst = severity
    }
  }
  return worst
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
                apply: (view: EditorView) => {
                  labels.onApplySuggestion?.()
                  view.dispatch({
                    changes: declarationInsertion(view.state.doc.toString(), saved.declaration),
                  })
                },
              },
            ],
          }
        : {}),
    }
  })
}

/**
 * What the schema says about the query's types and fields; a suggested name comes with an action
 * writing it. The suggestion is placed relative to the diagnostic, which edits may have moved.
 */
function schemaDiagnostics(
  findings: SchemaFinding[],
  labels: GroqEditorLabels | undefined,
): Diagnostic[] {
  return findings.map((finding) => {
    const {suggestion, param} = finding
    if (param) {
      const diagnostic: Diagnostic = {
        from: finding.from,
        to: finding.to,
        severity: 'warning',
        message: finding.message,
        renderMessage: () => renderMessage(finding.message),
        source: `vision/${finding.rule}`,
        markClass: PARAM_LINT_MARK_CLASS,
      }
      diagnosticTargets.set(diagnostic, {param})
      return diagnostic
    }
    const diagnostic: Diagnostic = {
      from: finding.from,
      to: finding.to,
      severity: 'warning',
      message: finding.message,
      renderMessage: () => renderMessage(finding.message),
      source: `vision/${finding.rule}`,
      ...(suggestion && labels
        ? {
            actions: [
              {
                name: labels.useSuggestion(suggestion.text),
                apply: (view: EditorView, from: number) => {
                  labels.onApplySuggestion?.()
                  view.dispatch({
                    changes: {
                      from: from + suggestion.from - finding.from,
                      to: from + suggestion.to - finding.from,
                      insert: suggestion.text,
                    },
                  })
                },
              },
            ],
          }
        : {}),
    }
    if (suggestion) {
      diagnosticTargets.set(diagnostic, {
        fix: {
          from: suggestion.from - finding.from,
          to: suggestion.to - finding.from,
          insert: suggestion.text,
        },
      })
    }
    return diagnostic
  })
}

/** The checks the editor runs on its own parse: custom functions, and the schema when it has one */
function editorDiagnostics(tree: GroqTree, query: string, state: EditorState): Diagnostic[] {
  const labels = state.facet(groqEditorLabels)
  const schema = state.facet(querySchema)
  return [
    ...functionDiagnostics(checkFunctions(tree, query, state.facet(functionLibrary)), labels),
    ...(schema
      ? schemaDiagnostics(
          checkQuerySchema(tree, query, schema, {params: state.facet(queryParamValues)}),
          labels,
        )
      : []),
  ]
}

/**
 * The lint source for the query editor: a parse failure becomes one error diagnostic on the
 * offending token, otherwise every `groq-lint` finding gets a diagnostic, and so does every
 * problem with the query's custom functions and function calls, and every type or field the
 * workspace schema does not have. When the wasm cannot be loaded, only the editor's own checks
 * run, as long as the query parses for the editor's own grammar.
 */
export async function groqLintSource(view: {state: EditorState}): Promise<Diagnostic[]> {
  const {state} = view
  const query = state.doc.toString()
  // CodeMirror lints the initial document too; a blank tab must not load the wasm
  if (!query.trim()) {
    return []
  }
  const tree = parseGroq(query)
  try {
    const findings = await lintGroq(query)
    return [
      ...toDiagnostics(findings, query.length),
      ...editorDiagnostics(tree, query, state),
    ].toSorted((a, b) => a.from - b.from || a.to - b.to)
  } catch (error) {
    if (error instanceof GroqSyntaxError) {
      const explanation = explainDeclarationSyntaxError(tree, query, error.from)
      return [syntaxErrorDiagnostic(error, query.length, explanation)]
    }
    return hasSyntaxErrors(tree) ? [] : editorDiagnostics(tree, query, state)
  }
}

/** The editor's current diagnostics, at their positions in the current document */
export function collectFindings(state: EditorState): QueryLintFinding[] {
  const findings: QueryLintFinding[] = []
  forEachDiagnostic(state, (diagnostic, from, to) => {
    const line = state.doc.lineAt(from)
    const target = diagnosticTargets.get(diagnostic)
    findings.push({
      from,
      to,
      line: line.number,
      column: from - line.from + 1,
      severity: diagnostic.severity,
      message: diagnostic.message,
      source: diagnostic.source,
      ...(target?.param ? {param: target.param} : {}),
      ...(target?.fix
        ? {fix: {...target.fix, from: from + target.fix.from, to: from + target.fix.to}}
        : {}),
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
      // A function saved to the library or removed from it changes what the query's calls know,
      // another schema what its types and fields are checked against, and other params the types
      // `_type == $type` narrows to
      needsRefresh: (update) =>
        update.startState.facet(functionLibrary) !== update.state.facet(functionLibrary) ||
        update.startState.facet(querySchema) !== update.state.facet(querySchema) ||
        update.startState.facet(queryParamValues) !== update.state.facet(queryParamValues),
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
