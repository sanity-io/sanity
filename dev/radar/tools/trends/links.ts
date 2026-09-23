/**
 * Backlinks from a benchmark point to the GitHub artifacts that produced it —
 * so a drifted metric leads straight to the PR / commit / CI run responsible.
 * Studio Radar only ever tracks this one repo.
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

export function releaseUrl(tag: string): string {
  return `https://github.com/${REPO}/releases/tag/${encodeURIComponent(tag)}`
}

/**
 * GitHub compare view listing every commit between two runs' commits — the
 * question a suspicious step in a chart raises is "what landed between these
 * two points". Three dots deliberately: the commit *range* reachable from
 * `toSha` but not `fromSha`, not a two-endpoint diff.
 */
export function compareUrl(fromSha: string, toSha: string): string {
  return `https://github.com/${REPO}/compare/${fromSha}...${toSha}`
}

/**
 * `gh` command dispatching an A/B bench run that compares two commits
 * (bench.yml `ab_from`/`ab_to` inputs — full shas required). A command to
 * copy rather than a link: GitHub has no URL that prefills workflow_dispatch
 * inputs. `-R` pins the repo so the command works from any directory.
 */
export function abDispatchCommand(fromSha: string, toSha: string): string {
  return `gh workflow run bench.yml -R ${REPO} -f ab_from=${fromSha} -f ab_to=${toSha}`
}

/** The dispatched-runs list, for watching an A/B comparison after dispatching it. */
export function dispatchRunsUrl(): string {
  return `https://github.com/${REPO}/actions/workflows/bench.yml?query=event%3Aworkflow_dispatch`
}

/** Link a scenario's source file on the branch it was measured on (or main). */
export function sourceFileUrl(path: string, branch = 'main'): string {
  return `https://github.com/${REPO}/blob/${branch}/${path}`
}

/**
 * web.dev reference article for a Core Web Vital / load metric, matched on the
 * metric label suffix (labels look like "boot-cold · LCP" or "INP"). Returns
 * undefined for non-vital metrics so no link is rendered.
 */
const WEB_VITAL_DOCS: Record<string, string> = {
  LCP: 'https://web.dev/articles/lcp',
  INP: 'https://web.dev/articles/inp',
  CLS: 'https://web.dev/articles/cls',
  FCP: 'https://web.dev/articles/fcp',
}

export function webVitalDocUrl(label: string): string | undefined {
  const key = Object.keys(WEB_VITAL_DOCS).find((vital) => label.endsWith(vital))
  return key ? WEB_VITAL_DOCS[key] : undefined
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
