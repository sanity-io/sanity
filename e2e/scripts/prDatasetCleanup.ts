/**
 * Decides which pull-request datasets a cleanup run deletes.
 *
 * A workflow run creates `pr-<number>-chromium-<run-id>` and
 * `pr-<number>-firefox-<run-id>`. Run ids increase, so an open pull request
 * keeps the datasets from its highest run id when that run is younger than 5
 * days, and deletes every earlier run. A run that is 5 days old or older is
 * deleted even when the pull request is still open. A closed pull request loses
 * all of them. `-comments` addons are left alone: deleting the dataset they
 * attach to removes them.
 */

export interface PrDataset {
  name: string
  createdAt: string
  addonFor: string | null
}

export interface PrDatasetPlan {
  prNumber: number
  open: boolean
  /** Highest run id among this pull request's datasets. Absent when the pull request is closed. */
  latestRunId: number | undefined
  keep: PrDataset[]
  delete: PrDataset[]
}

// `pr-12225-chromium-22576482973` and its `…-comments` addon.
const PR_DATASET_PATTERN = /^pr-(\d+)-(chromium|firefox)-(\d+)(-comments)?$/

export const OPEN_PR_MAX_AGE_MS = 3 * 24 * 60 * 60 * 1000

interface ParsedPrDataset {
  dataset: PrDataset
  prNumber: number
  runId: number
  comments: boolean
}

export function parsePrDataset(dataset: PrDataset): ParsedPrDataset | undefined {
  const match = PR_DATASET_PATTERN.exec(dataset.name)
  if (!match) return undefined
  return {
    dataset,
    prNumber: Number(match[1]),
    runId: Number(match[3]),
    comments: match[4] !== undefined,
  }
}

export function planPrDatasetCleanup(
  datasets: PrDataset[],
  openPrNumbers: ReadonlySet<number>,
  now = Date.now(),
): PrDatasetPlan[] {
  const byPr = new Map<number, ParsedPrDataset[]>()
  for (const dataset of datasets) {
    const parsed = parsePrDataset(dataset)
    // The comments addon disappears with the dataset it attaches to.
    if (!parsed || parsed.comments) continue
    const group = byPr.get(parsed.prNumber)
    if (group) group.push(parsed)
    else byPr.set(parsed.prNumber, [parsed])
  }

  const plans: PrDatasetPlan[] = []
  for (const [prNumber, group] of byPr) {
    const open = openPrNumbers.has(prNumber)
    if (!open) {
      plans.push({
        prNumber,
        open,
        latestRunId: undefined,
        keep: [],
        delete: group.map((entry) => entry.dataset),
      })
      continue
    }

    let latestRunId = group[0].runId
    for (const entry of group) {
      if (entry.runId > latestRunId) latestRunId = entry.runId
    }

    const keep: PrDataset[] = []
    const remove: PrDataset[] = []
    for (const entry of group) {
      const ageMs = now - new Date(entry.dataset.createdAt).getTime()
      const latestRunIsFresh = entry.runId === latestRunId && ageMs < OPEN_PR_MAX_AGE_MS
      if (latestRunIsFresh) keep.push(entry.dataset)
      else remove.push(entry.dataset)
    }
    plans.push({prNumber, open, latestRunId, keep, delete: remove})
  }

  plans.sort((left, right) => left.prNumber - right.prNumber)
  return plans
}
