/**
 * Backlinks from a benchmark point to the GitHub artifacts that produced it —
 * so a drifted metric leads straight to the PR / commit / CI run responsible.
 * The metrics studio only ever tracks this one repo.
 */
import {type TrendPoint} from './data'

const REPO = 'sanity-io/sanity'

export interface Backlink {
  label: string
  href: string
}

export function commitUrl(sha: string): string {
  return `https://github.com/${REPO}/commit/${sha}`
}

export function prUrl(prNumber: number): string {
  return `https://github.com/${REPO}/pull/${prNumber}`
}

export function ciRunUrl(runId: string, attempt?: number): string {
  const base = `https://github.com/${REPO}/actions/runs/${runId}`
  return attempt && attempt > 1 ? `${base}/attempts/${attempt}` : base
}

/** All backlinks that a point actually has data for, in usefulness order. */
export function backlinksFor(point: {
  sha?: string
  prNumber?: number
  ciRunId?: string
  ciRunAttempt?: number
}): Backlink[] {
  const links: Backlink[] = []
  if (typeof point.prNumber === 'number') {
    links.push({label: `PR #${point.prNumber}`, href: prUrl(point.prNumber)})
  }
  if (point.sha && point.sha !== 'unknown') {
    links.push({label: point.sha.slice(0, 7), href: commitUrl(point.sha)})
  }
  if (point.ciRunId) {
    links.push({label: 'CI run', href: ciRunUrl(point.ciRunId, point.ciRunAttempt)})
  }
  return links
}

export type {TrendPoint}
