import {type GeneratorFailure} from './generatorReport'

const ID_KEYS = new Set(['_id', 'id', 'draftId', 'publishedId'])
const DRAFTS_PREFIX = 'drafts.'
const VERSIONS_PATTERN = /^(versions\.[^.]+\.)(.+)$/

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function mapStrings<Value>(value: Value, mapping: ReadonlyMap<string, string>): Value {
  if (typeof value === 'string') return (mapping.get(value) ?? value) as Value
  if (Array.isArray(value)) return value.map((entry) => mapStrings(entry, mapping)) as Value
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, mapStrings(entry, mapping)]),
    ) as Value
  }
  return value
}

export function mapRevisionPreconditions<Value>(
  value: Value,
  revisions: ReadonlyMap<string, string>,
): Value {
  if (Array.isArray(value)) {
    return value.map((entry) => mapRevisionPreconditions(entry, revisions)) as Value
  }
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        key === 'ifRevisionID' && typeof entry === 'string'
          ? (revisions.get(entry) ?? entry)
          : mapRevisionPreconditions(entry, revisions),
      ]),
    ) as Value
  }
  return value
}

function collectIdValues(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(collectIdValues)
  if (isRecord(value)) {
    return Object.entries(value).flatMap(([key, entry]) =>
      ID_KEYS.has(key) && typeof entry === 'string' ? [entry] : collectIdValues(entry),
    )
  }
  return []
}

function publishedIdOf(id: string): string {
  if (id.startsWith(DRAFTS_PREFIX)) return id.slice(DRAFTS_PREFIX.length)
  return VERSIONS_PATTERN.exec(id)?.[2] ?? id
}

export function documentIdsOf(failure: GeneratorFailure): string[] {
  const {idPair} = failure.definition
  const mentioned = [
    ...failure.initial.map((document) => document._id),
    ...[idPair.publishedId, idPair.draftId, idPair.versionId].filter(
      (id): id is string => typeof id === 'string',
    ),
    ...failure.submissions.flatMap((submission) => collectIdValues(submission.request)),
  ]
  const expanded = mentioned.flatMap((id) => {
    const publishedId = publishedIdOf(id)
    return [id, publishedId, `${DRAFTS_PREFIX}${publishedId}`]
  })
  return [...new Set(expanded)].toSorted()
}

export function namespacedId(prefix: string, id: string): string {
  if (id.startsWith(DRAFTS_PREFIX)) return `${DRAFTS_PREFIX}${prefix}${publishedIdOf(id)}`
  const version = VERSIONS_PATTERN.exec(id)
  return version ? `${version[1]}${prefix}${version[2]}` : `${prefix}${id}`
}

export interface IdNamespace {
  prefix: string
  fakeIds: string[]
  realIds: string[]
  toReal: ReadonlyMap<string, string>
  toFake: ReadonlyMap<string, string>
}

export function createIdNamespace(prefix: string, fakeIds: string[]): IdNamespace {
  const pairs = fakeIds.map((id) => [id, namespacedId(prefix, id)] as const)
  return {
    prefix,
    fakeIds,
    realIds: pairs.map(([, realId]) => realId),
    toReal: new Map(pairs),
    toFake: new Map(pairs.map(([fakeId, realId]) => [realId, fakeId])),
  }
}
