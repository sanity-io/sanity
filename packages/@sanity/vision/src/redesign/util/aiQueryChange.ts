import {type AiLintFinding, type AiQueryChange, type FetchReason} from '../store/types'
import {type FetchOnOpenSource} from '../store/visionMachine'
import {type QueryLintFinding} from './groqLint'

/**
 * How a tab is asked to fetch a query an AI action wrote: the change rides along to the fetch's
 * history entry, so History can show the action and what it was given after the panel that ran it
 * has cleared. Whatever runs the action, a hook or an actor, loads the query with this.
 */
export function aiGeneratedFetch(change: AiQueryChange | undefined): FetchOnOpenSource {
  return change ? {type: 'generated', ai: change} : 'generated'
}

/** The history reason of a fetch a tab makes as soon as it is shown */
export function fetchOnOpenReason(source: FetchOnOpenSource): FetchReason {
  return typeof source === 'string' ? {type: source} : source
}

/** The lint findings Fix with AI was asked to fix, as History lists them */
export function aiLintFindings(findings: readonly QueryLintFinding[]): AiLintFinding[] {
  return findings.map(({line, column, severity, message}) => ({line, column, severity, message}))
}
