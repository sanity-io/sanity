import {type QueryLintFinding} from './groqLint'
import {applyParamSuggestion, isParamLintFinding, type ParamLintTarget} from './paramLint'

/** Where a lint finding is fixed */
export type LintFixTarget = 'query' | 'params'

/** What the agent is asked to fix: the query, the params' values, or both */
export type LintAgentTarget = LintFixTarget | 'both'

export interface LintFixPlan {
  /** The quick fixes of query findings, which need no agent */
  queryEdits: {from: number; to: number; insert: string}[]
  /** The suggestions of param findings, which need no agent */
  paramFixes: ParamLintTarget[]
  /** The findings without a quick fix, for the agent, and what it is to change for them */
  agent: {findings: QueryLintFinding[]; target: LintAgentTarget} | undefined
}

export function lintFixTarget(finding: QueryLintFinding): LintFixTarget {
  return isParamLintFinding(finding) ? 'params' : 'query'
}

/**
 * Splits the findings by how they are fixed: a "Did you mean" suggestion is written in place, in
 * the query or in the params, and only the findings without one go to the agent, which is told
 * whether they are in the query, in the params' values, or in both
 */
export function planLintFix(findings: readonly QueryLintFinding[]): LintFixPlan {
  const queryEdits: LintFixPlan['queryEdits'] = []
  const paramFixes: ParamLintTarget[] = []
  const rest: QueryLintFinding[] = []
  for (const finding of findings) {
    if (isParamLintFinding(finding)) {
      if (finding.param.suggestion === undefined) rest.push(finding)
      else paramFixes.push(finding.param)
    } else if (finding.fix) {
      queryEdits.push(finding.fix)
    } else {
      rest.push(finding)
    }
  }
  const targets = new Set(rest.map(lintFixTarget))
  const target: LintAgentTarget =
    targets.size > 1 ? 'both' : (targets.values().next().value ?? 'query')
  return {
    // Edits that overlap would write over each other: the first one wins
    queryEdits: queryEdits
      .toSorted((a, b) => a.from - b.from)
      .filter((edit, index, edits) => index === 0 || edit.from >= edits[index - 1].to),
    paramFixes,
    agent: rest.length > 0 ? {findings: rest, target} : undefined,
  }
}

/** The query with the edits made, which must not overlap */
export function applyQueryEdits(query: string, edits: LintFixPlan['queryEdits']): string {
  let result = query
  for (const edit of edits.toSorted((a, b) => b.from - a.from)) {
    result = `${result.slice(0, edit.from)}${edit.insert}${result.slice(edit.to)}`
  }
  return result
}

/**
 * The params text with every suggestion written in place; a suggestion whose value is no longer
 * in the text is skipped
 */
export function applyParamFixes(
  rawParams: string,
  fixes: readonly ParamLintTarget[],
): {text: string; changes: {from: number; to: number; insert: string}[]} {
  let text = rawParams
  for (const fix of fixes) {
    const applied = applyParamSuggestion(text, fix)
    if (applied) text = applied.text
  }
  if (text === rawParams) return {text, changes: []}
  // One change for the whole difference, so the editor applies it as a single undoable edit
  let start = 0
  while (start < text.length && start < rawParams.length && text[start] === rawParams[start]) {
    start++
  }
  let endOld = rawParams.length
  let endNew = text.length
  while (endOld > start && endNew > start && rawParams[endOld - 1] === text[endNew - 1]) {
    endOld--
    endNew--
  }
  return {text, changes: [{from: start, to: endOld, insert: text.slice(start, endNew)}]}
}

/**
 * The findings at their places in the query after the edits were made, which must not overlap
 * them, so what the agent is told about them points into the query it is given
 */
export function shiftFindings(
  findings: readonly QueryLintFinding[],
  edits: LintFixPlan['queryEdits'],
  query: string,
): QueryLintFinding[] {
  if (edits.length === 0) return [...findings]
  const shift = (offset: number) =>
    edits.reduce(
      (delta, edit) =>
        edit.to <= offset ? delta + edit.insert.length - (edit.to - edit.from) : delta,
      0,
    )
  return findings.map((finding) => {
    if (finding.param) return finding
    const from = finding.from + shift(finding.from)
    const to = finding.to + shift(finding.to)
    const before = query.slice(0, from)
    const line = before.split('\n').length
    const column = from - before.lastIndexOf('\n')
    return {...finding, from, to, line, column}
  })
}
