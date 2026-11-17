import {
  CATALOGUE_SUITE_IDS,
  type CatalogueEntryResult,
  type CatalogueSuiteId,
  type CatalogueSuiteResult,
} from '@repo/utils/engine-confidence'

export interface CatalogueResultsFile {
  repoHead: string
  startedAt: string
  completedAt: string
  fuzzSeeds: number[]
  fuzzRuns: number
  suitesRun: CatalogueSuiteId[]
  entries: CatalogueEntryResult[]
  inertEntries: string[]
  suiteTimings: Array<{suite: CatalogueSuiteId; baselineDurationMs: number}>
}

const MAX_FAILING_TESTS_PER_SUITE = 20

export function suiteResultOf(
  suite: CatalogueSuiteId,
  outcome: Omit<CatalogueSuiteResult, '_key' | 'suite'>,
): CatalogueSuiteResult {
  const suiteIndex = CATALOGUE_SUITE_IDS.indexOf(suite)
  return {
    _key: `suite-${suiteIndex}`,
    suite,
    ...outcome,
    ...(outcome.failingTests === undefined
      ? {}
      : {failingTests: outcome.failingTests.slice(0, MAX_FAILING_TESTS_PER_SUITE)}),
  }
}

export function renderMatrix(entries: CatalogueEntryResult[]): string {
  const header = `| Entry | ${CATALOGUE_SUITE_IDS.join(' | ')} |`
  const divider = `| --- | ${CATALOGUE_SUITE_IDS.map(() => '---').join(' | ')} |`
  const rows = entries.map((entry) => {
    const cells = CATALOGUE_SUITE_IDS.map((suite) => {
      const result = entry.results.find((candidate) => candidate.suite === suite)
      if (result === undefined) return 'not-run'
      const seconds =
        result.durationMs === undefined ? '' : ` (${Math.round(result.durationMs / 1000)}s)`
      return `${result.status}${seconds}`
    })
    return `| ${entry.id} | ${cells.join(' | ')} |`
  })
  const caught = entries.filter((entry) =>
    entry.results.some((result) => result.status === 'caught'),
  ).length
  return [header, divider, ...rows, '', `Known bugs caught: ${caught}/${entries.length}`].join('\n')
}
