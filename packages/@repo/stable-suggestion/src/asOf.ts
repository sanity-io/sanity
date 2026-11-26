import semver from 'semver'

import {mapSourced} from './sourced'
import {compareByAt} from './time'
import {
  type Evidence,
  type History,
  type IsoDate,
  type IssueReport,
  type StablePromotion,
} from './types'

const NO_PROMOTION_VERSION = '0.0.0'
const LEAK_MARKER = '0.0.0-leak'
const NOT_RECORDED = {status: 'unavailable', error: 'not recorded in this history'} as const

interface Clock {
  isKnown: (timestamp: IsoDate) => boolean
  isAfter: (timestamp: IsoDate) => boolean
}

function createClock(asOf: IsoDate): Clock {
  const asOfMs = Date.parse(asOf)
  return {
    isKnown: (timestamp) => Date.parse(timestamp) <= asOfMs,
    isAfter: (timestamp) => Date.parse(timestamp) > asOfMs,
  }
}

function createdBy<Entry extends {createdAt: IsoDate}>(entries: Entry[], clock: Clock): Entry[] {
  return entries.filter((entry) => clock.isKnown(entry.createdAt))
}

function issuesAsOf(issues: IssueReport[], clock: Clock): IssueReport[] {
  return createdBy(issues, clock).map((issue) => ({
    ...issue,
    closedAt: issue.closedAt !== null && clock.isAfter(issue.closedAt) ? null : issue.closedAt,
  }))
}

function newest<Entry extends {at: IsoDate}>(entries: Entry[]): Entry | undefined {
  return entries.toSorted(compareByAt).at(-1)
}

function newestPromotionAt(history: History, clock: Clock): StablePromotion | undefined {
  if (history.stablePromotions.status !== 'ok') {
    throw new Error('Cannot evaluate as-of: the @stable promotion history is unavailable')
  }
  return newest(history.stablePromotions.data.filter((promotion) => clock.isKnown(promotion.at)))
}

function resolveStable(
  history: History,
  mode: Evidence['mode'],
  clock: Clock,
): {currentStable: string; currentStableSince: IsoDate | null} {
  if (mode === 'as-of') {
    const promotion = newestPromotionAt(history, clock)
    return {
      currentStable: promotion?.version ?? NO_PROMOTION_VERSION,
      currentStableSince: promotion?.at ?? null,
    }
  }
  const currentStable = history.liveDistTags.stable
  const since =
    history.stablePromotions.status === 'ok'
      ? newest(
          history.stablePromotions.data.filter((promotion) => promotion.version === currentStable),
        )
      : undefined
  return {currentStable, currentStableSince: since?.at ?? null}
}

export function viewAsOf(history: History, asOf: IsoDate, mode: Evidence['mode']): Evidence {
  const clock = createClock(asOf)
  const published = history.sanityVersions
    .filter((entry) => clock.isKnown(entry.publishedAt))
    .toSorted((left, right) => semver.compare(left.version, right.version))
  const publishedAtByVersion = new Map(published.map((entry) => [entry.version, entry.publishedAt]))
  const highestPublished = published.at(-1)
  if (!highestPublished) {
    throw new Error(`No sanity version was published on or before ${asOf}`)
  }
  const latest = mode === 'live' ? history.liveDistTags.latest : highestPublished.version
  const {currentStable, currentStableSince} = resolveStable(history, mode, clock)

  const packageSet: Evidence['packageSet'] =
    mode === 'live'
      ? {names: history.repoPackageNames, source: 'repo'}
      : {
          names: history.repoPackageNames.filter((name) =>
            history.packageVersions[name]?.includes(latest),
          ),
          source: 'as-of-inferred',
        }

  const versions = published
    .filter((entry) => semver.gt(entry.version, currentStable))
    .map((entry) => ({
      version: entry.version,
      publishedAt: entry.publishedAt,
      deprecated: mode === 'live' ? entry.deprecated : null,
      packagesWithVersion: packageSet.names.filter((name) =>
        history.packageVersions[name]?.includes(entry.version),
      ),
    }))

  const keepsRegressionKnowledge = (knownAt: IsoDate) => mode === 'live' || clock.isKnown(knownAt)

  return {
    schemaVersion: 1,
    mode,
    asOf,
    currentStable,
    currentStableSince,
    latest,
    deprecationKnown: mode === 'live',
    published: published.map(({version, publishedAt}) => ({version, publishedAt})),
    versions,
    packageSet,
    regressions: mapSourced(history.regressions, (data) => ({
      confirmed: data.confirmed
        .filter((record) => keepsRegressionKnowledge(record.knownAt))
        .map((record) => ({
          ...record,
          fixedIn:
            record.fixedIn !== null && publishedAtByVersion.has(record.fixedIn)
              ? record.fixedIn
              : null,
        })),
      investigations: data.investigations
        .filter(
          (entry) =>
            clock.isKnown(entry.knownAt) &&
            (entry.resolvedAt == null || (mode === 'as-of' && clock.isAfter(entry.resolvedAt))),
        )
        .map((entry) => ({...entry, resolvedAt: null})),
    })),
    sqrl: mapSourced(history.sqrl, (data) => createdBy(data, clock)),
    issues: mapSourced(history.issues, (data) => issuesAsOf(data, clock)),
    downloads: mode === 'live' ? history.liveDownloads : {status: 'not-applicable'},
    releaseBench: mapSourced(history.releaseBench, (data) => createdBy(data, clock)),
    latestMoves: history.latestMoves
      ? mapSourced(history.latestMoves, (data) => data.filter((move) => clock.isKnown(move.at)))
      : NOT_RECORDED,
    stableByPackage:
      mode === 'live' ? (history.stableByPackage ?? NOT_RECORDED) : {status: 'not-applicable'},
  }
}

export function truncateHistory(history: History, asOf: IsoDate): History {
  const clock = createClock(asOf)
  const sanityVersions = history.sanityVersions
    .filter((entry) => clock.isKnown(entry.publishedAt))
    .map((entry) => ({...entry, deprecated: LEAK_MARKER}))
  const keptVersions = new Set(sanityVersions.map((entry) => entry.version))
  return {
    ...history,
    fetchedAt: clock.isKnown(history.fetchedAt) ? history.fetchedAt : asOf,
    liveDistTags: {latest: LEAK_MARKER, stable: LEAK_MARKER},
    liveDownloads: {status: 'unavailable', error: LEAK_MARKER},
    ...(history.stableByPackage
      ? {stableByPackage: {status: 'unavailable' as const, error: LEAK_MARKER}}
      : {}),
    sanityVersions,
    packageVersions: Object.fromEntries(
      Object.entries(history.packageVersions).map(([name, versions]) => [
        name,
        versions.filter((version) => keptVersions.has(version)),
      ]),
    ),
    stablePromotions: mapSourced(history.stablePromotions, (data) =>
      data.filter((promotion) => clock.isKnown(promotion.at)),
    ),
    ...(history.latestMoves
      ? {
          latestMoves: mapSourced(history.latestMoves, (data) =>
            data.filter((move) => clock.isKnown(move.at)),
          ),
        }
      : {}),
    regressions: mapSourced(history.regressions, (data) => ({
      confirmed: data.confirmed.filter((record) => clock.isKnown(record.knownAt)),
      investigations: data.investigations
        .filter((entry) => clock.isKnown(entry.knownAt))
        .map((entry) => ({
          ...entry,
          resolvedAt: entry.resolvedAt && clock.isKnown(entry.resolvedAt) ? entry.resolvedAt : null,
        })),
    })),
    sqrl: mapSourced(history.sqrl, (data) => createdBy(data, clock)),
    releaseBench: mapSourced(history.releaseBench, (data) => createdBy(data, clock)),
    issues: mapSourced(history.issues, (data) => issuesAsOf(data, clock)),
  }
}
