import semver from 'semver'

import {PACKAGE_NAME} from '../config'
import {type History} from '../types'

export type FetchImpl = typeof fetch

const REGISTRY_URL = 'https://registry.npmjs.org'
const DOWNLOADS_URL = 'https://api.npmjs.org'
const ABBREVIATED_ACCEPT = 'application/vnd.npm.install-v1+json'

export type SanityVersion = History['sanityVersions'][number]

interface Packument {
  time?: Record<string, string>
  versions?: Record<string, {deprecated?: string}>
}

interface AbbreviatedPackument {
  versions?: Record<string, unknown>
}

export function isStableRelease(version: string): boolean {
  return semver.valid(version) !== null && semver.prerelease(version) === null
}

export function normaliseSanityVersions(packument: Packument): SanityVersion[] {
  const time = packument.time ?? {}
  return Object.keys(packument.versions ?? {})
    .filter(isStableRelease)
    .flatMap((version) => {
      const publishedAt = time[version]
      if (!publishedAt) return []
      return [{version, publishedAt, deprecated: packument.versions?.[version]?.deprecated || null}]
    })
    .toSorted((left, right) => semver.compare(left.version, right.version))
}

export function normalisePackageVersions(packument: AbbreviatedPackument): string[] {
  return Object.keys(packument.versions ?? {})
    .filter(isStableRelease)
    .toSorted(semver.compare)
}

export function normaliseDistTags(raw: Record<string, string>): History['liveDistTags'] {
  const {latest, stable} = raw
  if (!latest || !stable) {
    throw new Error('npm dist-tags response is missing latest or stable')
  }
  return {latest, stable}
}

export function normaliseDownloads(raw: {
  downloads?: Record<string, number>
}): Record<string, number> {
  return raw.downloads ?? {}
}

async function getJson<Body>(fetchImpl: FetchImpl, url: string, accept?: string): Promise<Body> {
  const response = await fetchImpl(url, accept ? {headers: {Accept: accept}} : undefined)
  if (!response.ok) {
    throw new Error(`npm request failed (${response.status}) for ${url}`)
  }
  return (await response.json()) as Body
}

function encodePackageName(name: string): string {
  return name.replace('/', '%2F')
}

function packageUrl(name: string): string {
  return `${REGISTRY_URL}/${encodePackageName(name)}`
}

function distTagsUrl(name: string): string {
  return `${REGISTRY_URL}/-/package/${encodePackageName(name)}/dist-tags`
}

export async function fetchSanityVersions(fetchImpl: FetchImpl): Promise<SanityVersion[]> {
  return normaliseSanityVersions(await getJson<Packument>(fetchImpl, packageUrl(PACKAGE_NAME)))
}

export async function fetchPackageVersions(fetchImpl: FetchImpl, name: string): Promise<string[]> {
  return normalisePackageVersions(
    await getJson<AbbreviatedPackument>(fetchImpl, packageUrl(name), ABBREVIATED_ACCEPT),
  )
}

export async function fetchDistTags(fetchImpl: FetchImpl): Promise<History['liveDistTags']> {
  return normaliseDistTags(
    await getJson<Record<string, string>>(fetchImpl, distTagsUrl(PACKAGE_NAME)),
  )
}

function normaliseStableTag(distTags: Record<string, string>): string | null {
  return distTags.stable ?? null
}

export async function fetchStableTag(fetchImpl: FetchImpl, name: string): Promise<string | null> {
  return normaliseStableTag(await getJson<Record<string, string>>(fetchImpl, distTagsUrl(name)))
}

export async function fetchLastWeekDownloads(
  fetchImpl: FetchImpl,
): Promise<Record<string, number>> {
  return normaliseDownloads(
    await getJson<{downloads?: Record<string, number>}>(
      fetchImpl,
      `${DOWNLOADS_URL}/versions/${PACKAGE_NAME}/last-week`,
    ),
  )
}
