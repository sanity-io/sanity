import {createClient} from '@sanity/client'
import semver from 'semver'

import {RADAR} from '../config'
import {errorMessage} from '../sourced'
import {
  type History,
  type Investigation,
  type RegressionRecord,
  type ReleaseBench,
  type SqrlFacts,
  type Sourced,
} from '../types'

export interface RadarClient {
  fetch: (query: string, params?: Record<string, unknown>) => Promise<unknown>
}

export interface RadarSession {
  _id: string
  _createdAt: string
  _updatedAt: string
  good: string | null
  bad: string | null
  regression: boolean | null
  severity: RegressionRecord['severity']
  fixedIn: string | null
  firstBadSha: string | null
  firstBadTag: string | null
  firstBadCommittedAt: string | null
}

export interface RadarTag {
  tag: string
  sha: string
  taggedAt: string
  onMainline: boolean
}

export interface RadarSqrlRow {
  _createdAt: string
  sha: string
  score: number | null
  scoreCommit: number | null
  formulaVersion: number | null
  regressedInputs: string[] | null
  reliabilityEvents: number | null
}

export interface RadarBenchRow {
  _createdAt: string
  sha: string
  calibrationMs: number | null
  initialJsBytes: number | null
  totalJsBytes: number | null
}

export type RadarRegressions = {
  confirmed: RegressionRecord[]
  investigations: Investigation[]
}

const SESSIONS_QUERY = `*[_type=="bisectSession"]{_id,_createdAt,_updatedAt,"good":good.label,"bad":bad.label,
  "regression":result.regression,"severity":result.severity,"fixedIn":result.fixedIn,
  "firstBadSha":result.firstBadSha,
  "firstBadTag":*[_type=="gitTag" && sha==^.result.firstBadSha][0].tag,
  "firstBadCommittedAt":*[_type=="gitCommit" && sha==^.result.firstBadSha][0].committedAt}`

const TAGS_QUERY = `*[_type=="gitTag" && !defined(prerelease)]{tag, sha, taggedAt, "onMainline": defined(commit->_id)}`

const SQRL_QUERY = `*[_type=="sqrlScore" && git.sha in $shas]{_createdAt,"sha":git.sha,score,scoreCommit,formulaVersion,
  "regressedInputs":inputs[trend=="regression"].key,"reliabilityEvents":reliability.count}`

const BENCH_QUERY = `*[_type=="benchRun" && mode=="absolute" && trigger=="release" && git.sha in $shas]{_createdAt,"sha":git.sha,
  "calibrationMs":runner.calibrationMs,"initialJsBytes":bundle.experiment.initialJsBytes,"totalJsBytes":bundle.experiment.totalJsBytes}`

function validVersion(label: string | null | undefined): string | null {
  return label ? semver.valid(label) : null
}

function earliestTagVersionAfter(
  tags: RadarTag[],
  afterMs: number,
  isCandidate: (tag: RadarTag, version: string) => boolean,
): string | undefined {
  return tags
    .flatMap((tag): string[] => {
      const version = validVersion(tag.tag)
      return version !== null &&
        semver.prerelease(version) === null &&
        isCandidate(tag, version) &&
        Date.parse(tag.taggedAt) >= afterMs
        ? [version]
        : []
    })
    .toSorted(semver.compare)[0]
}

export function deriveIntroducedIn(session: RadarSession, tags: RadarTag[]): string | null {
  const badVersion = validVersion(session.bad)
  const exactTagVersion = validVersion(session.firstBadTag)
  const firstBadCommittedAtMs = session.firstBadCommittedAt
    ? Date.parse(session.firstBadCommittedAt)
    : null
  const tagVersionAfterCommit =
    firstBadCommittedAtMs === null
      ? undefined
      : earliestTagVersionAfter(tags, firstBadCommittedAtMs, (tag, version) =>
          badVersion === null ? tag.onMainline : semver.major(version) === semver.major(badVersion),
        )
  const candidates = [exactTagVersion, tagVersionAfterCommit, badVersion].filter(
    (version): version is string => typeof version === 'string',
  )
  return candidates.toSorted(semver.compare)[0] ?? null
}

function toLabel(session: RadarSession): string {
  return `${session.good ?? '?'} → ${session.bad ?? '?'}`
}

function isUnplaceable(session: RadarSession, introducedIn: string | null): boolean {
  return introducedIn === null && session.firstBadCommittedAt === null
}

export function normaliseRegressions(
  sessions: RadarSession[],
  tags: RadarTag[],
): Sourced<RadarRegressions> {
  const placed = sessions
    .filter((session) => session.regression === true)
    .map((session) => ({session, introducedIn: deriveIntroducedIn(session, tags)}))
  const unplaceable = placed.filter((entry) => isUnplaceable(entry.session, entry.introducedIn))
  if (unplaceable.length > 0) {
    const ids = unplaceable.map((entry) => entry.session._id).join(', ')
    return {
      status: 'unavailable',
      error: `confirmed regression ${ids} cannot be placed on a release because its first bad commit is not synced to Radar`,
    }
  }
  const confirmed = placed.flatMap(({session, introducedIn}): RegressionRecord[] =>
    introducedIn === null
      ? []
      : [
          {
            id: session._id,
            introducedIn,
            fixedIn: validVersion(session.fixedIn),
            severity: session.severity ?? null,
            knownAt: session._updatedAt,
            label: toLabel(session),
          },
        ],
  )
  const investigations = sessions.flatMap((session): Investigation[] => {
    const goodVersion = validVersion(session.good)
    const badVersion = validVersion(session.bad)
    if (!goodVersion || !badVersion) return []
    const resolved = session.regression !== null && session.regression !== undefined
    return [
      {
        id: session._id,
        goodVersion,
        badVersion,
        knownAt: session._createdAt,
        resolvedAt: resolved ? session._updatedAt : null,
      },
    ]
  })
  return {status: 'ok', data: {confirmed, investigations}}
}

function versionsBySha(tags: RadarTag[]): Map<string, string> {
  return new Map(
    tags.flatMap((tag): [string, string][] => {
      const version = validVersion(tag.tag)
      return version ? [[tag.sha, version]] : []
    }),
  )
}

export function normaliseSqrl(rows: RadarSqrlRow[], tags: RadarTag[]): SqrlFacts[] {
  const shaToVersion = versionsBySha(tags)
  return rows
    .flatMap((row): SqrlFacts[] => {
      const version = shaToVersion.get(row.sha)
      if (!version || typeof row.score !== 'number') return []
      return [
        {
          version,
          score: row.score,
          scoreCommit: row.scoreCommit ?? row.score,
          formulaVersion: row.formulaVersion ?? 1,
          regressedInputs: row.regressedInputs ?? [],
          reliabilityEvents: row.reliabilityEvents ?? 0,
          createdAt: row._createdAt,
        },
      ]
    })
    .toSorted((left, right) => semver.compare(left.version, right.version))
}

export function normaliseBench(rows: RadarBenchRow[], tags: RadarTag[]): ReleaseBench[] {
  const shaToVersion = versionsBySha(tags)
  const earliestByVersion = rows
    .toSorted((left, right) => left._createdAt.localeCompare(right._createdAt))
    .reduce((byVersion, row) => {
      const version = shaToVersion.get(row.sha)
      if (!version || byVersion.has(version)) return byVersion
      return byVersion.set(version, {
        version,
        calibrationMs: row.calibrationMs ?? null,
        initialJsBytes: row.initialJsBytes ?? null,
        totalJsBytes: row.totalJsBytes ?? null,
        createdAt: row._createdAt,
      })
    }, new Map<string, ReleaseBench>())
  return [...earliestByVersion.values()].toSorted((left, right) =>
    semver.compare(left.version, right.version),
  )
}

export function createRadarClient(token: string): RadarClient {
  return createClient({
    projectId: RADAR.projectId,
    dataset: RADAR.dataset,
    apiVersion: RADAR.apiVersion,
    token,
    useCdn: false,
  })
}

export interface RadarHistory {
  regressions: History['regressions']
  sqrl: History['sqrl']
  releaseBench: History['releaseBench']
}

function unavailable(reason: string): RadarHistory {
  const result = {status: 'unavailable', error: reason} as const
  return {regressions: result, sqrl: result, releaseBench: result}
}

export async function fetchRadarHistory(client: RadarClient | null): Promise<RadarHistory> {
  if (!client) return unavailable('RADAR_SANITY_READ_TOKEN is not set')
  try {
    const [sessions, tags] = (await Promise.all([
      client.fetch(SESSIONS_QUERY),
      client.fetch(TAGS_QUERY),
    ])) as [RadarSession[], RadarTag[]]
    const shas = tags.map((tag) => tag.sha)
    const [sqrlRows, benchRows] = (await Promise.all([
      client.fetch(SQRL_QUERY, {shas}),
      client.fetch(BENCH_QUERY, {shas}),
    ])) as [RadarSqrlRow[], RadarBenchRow[]]
    return {
      regressions: normaliseRegressions(sessions, tags),
      sqrl: {status: 'ok', data: normaliseSqrl(sqrlRows, tags)},
      releaseBench: {status: 'ok', data: normaliseBench(benchRows, tags)},
    }
  } catch (error) {
    return unavailable(errorMessage(error))
  }
}
