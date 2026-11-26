import {PACKAGE_NAME} from './config'
import {toSourced} from './sourced'
import {
  fetchIssues,
  fetchLatestMoves,
  fetchStablePromotions,
  type GitHubDeps,
} from './sources/github'
import {
  type FetchImpl,
  fetchDistTags,
  fetchLastWeekDownloads,
  fetchPackageVersions,
  fetchSanityVersions,
  fetchStableTag,
} from './sources/npm'
import {listPublishedPackageNames} from './sources/publishedPackages'
import {fetchRadarHistory, type RadarClient} from './sources/radar'
import {type History} from './types'

export interface FetchHistoryDeps {
  fetchImpl: FetchImpl
  radarClient: RadarClient | null
  githubToken: string | null
  issuesFrom: Date
  now?: Date
  repoPackageNames?: string[]
}

const GITHUB_UNAVAILABLE = {status: 'unavailable', error: 'no GitHub token available'} as const

export async function fetchHistory(deps: FetchHistoryDeps): Promise<History> {
  const {fetchImpl} = deps
  const now = deps.now ?? new Date()
  const repoPackageNames = deps.repoPackageNames ?? listPublishedPackageNames()
  const github: GitHubDeps | null = deps.githubToken ? {fetchImpl, token: deps.githubToken} : null

  const [
    sanityVersions,
    liveDistTags,
    otherPackageVersions,
    liveDownloads,
    stableByPackage,
    radar,
  ] = await Promise.all([
    fetchSanityVersions(fetchImpl),
    fetchDistTags(fetchImpl),
    Promise.all(
      repoPackageNames
        .filter((name) => name !== PACKAGE_NAME)
        .map(async (name) => [name, await fetchPackageVersions(fetchImpl, name)] as const),
    ),
    toSourced(() => fetchLastWeekDownloads(fetchImpl)),
    toSourced(async () =>
      Object.fromEntries(
        await Promise.all(
          repoPackageNames.map(
            async (name) => [name, await fetchStableTag(fetchImpl, name)] as const,
          ),
        ),
      ),
    ),
    fetchRadarHistory(deps.radarClient),
  ])

  const [stablePromotions, issues, latestMoves] = github
    ? await Promise.all([
        fetchStablePromotions(github),
        fetchIssues(github, {
          from: deps.issuesFrom,
          to: now,
          knownVersions: sanityVersions.map((entry) => entry.version),
        }),
        fetchLatestMoves(github),
      ])
    : [GITHUB_UNAVAILABLE, GITHUB_UNAVAILABLE, GITHUB_UNAVAILABLE]

  return {
    fetchedAt: now.toISOString(),
    sanityVersions,
    packageVersions: {
      ...Object.fromEntries(otherPackageVersions),
      [PACKAGE_NAME]: sanityVersions.map((entry) => entry.version),
    },
    repoPackageNames,
    liveDistTags,
    liveDownloads,
    stablePromotions,
    latestMoves,
    stableByPackage,
    regressions: radar.regressions,
    sqrl: radar.sqrl,
    releaseBench: radar.releaseBench,
    issues,
  }
}
