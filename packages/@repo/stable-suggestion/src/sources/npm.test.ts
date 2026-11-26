import {describe, expect, test} from 'vitest'

import {loadRawFixture} from '../__fixtures__/load'
import {
  fetchDistTags,
  fetchLastWeekDownloads,
  fetchPackageVersions,
  fetchSanityVersions,
  normaliseDistTags,
  normaliseDownloads,
  normalisePackageVersions,
  normaliseSanityVersions,
} from './npm'

function routeFetch(routes: Record<string, unknown>, seen: {url: string; accept?: string}[] = []) {
  return async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const url = String(input)
    seen.push({url, accept: (init?.headers as Record<string, string> | undefined)?.Accept})
    const body = routes[url]
    return body === undefined
      ? new Response('not found', {status: 404})
      : new Response(JSON.stringify(body), {status: 200})
  }
}

describe('normaliseSanityVersions', () => {
  const packument = loadRawFixture<Parameters<typeof normaliseSanityVersions>[0]>('npm-packument')

  test('keeps release versions with a publish time, sorted by semver', () => {
    const versions = normaliseSanityVersions(packument)
    expect(versions.map((entry) => entry.version)).not.toContain('6.9.1-next.1')
    expect(versions.map((entry) => entry.version).slice(0, 3)).toEqual(['0.3.0', '0.4.0', '4.20.3'])
    expect(versions.find((entry) => entry.version === '6.9.2')?.publishedAt).toBe(
      packument.time?.['6.9.2'],
    )
  })

  test('maps empty deprecation to null and keeps a message', () => {
    const versions = normaliseSanityVersions({
      time: {'1.0.0': '2020-01-01T00:00:00.000Z', '1.1.0': '2020-02-01T00:00:00.000Z'},
      versions: {'1.0.0': {deprecated: ''}, '1.1.0': {deprecated: 'use 1.2.0'}},
    })
    expect(versions.map((entry) => entry.deprecated)).toEqual([null, 'use 1.2.0'])
  })

  test('drops versions without a publish time', () => {
    expect(normaliseSanityVersions({time: {}, versions: {'1.0.0': {}}})).toEqual([])
  })
})

describe('normalisePackageVersions', () => {
  test('drops prereleases and sorts', () => {
    expect(
      normalisePackageVersions({
        versions: {'6.0.0': {}, '5.1.0': {}, '6.1.0-next.1': {}, '10.0.0': {}},
      }),
    ).toEqual(['5.1.0', '6.0.0', '10.0.0'])
  })
})

describe('normaliseDistTags and normaliseDownloads', () => {
  test('requires latest and stable', () => {
    expect(normaliseDistTags({latest: '6.24.0', stable: '6.15.0', next: '6.25.0-next.1'})).toEqual({
      latest: '6.24.0',
      stable: '6.15.0',
    })
    expect(() => normaliseDistTags({latest: '6.24.0'})).toThrow(/stable/)
  })

  test('reads the downloads map', () => {
    const raw = loadRawFixture<{downloads: Record<string, number>}>('npm-downloads')
    expect(normaliseDownloads(raw)['6.23.0']).toBeGreaterThan(0)
    expect(normaliseDownloads({})).toEqual({})
  })
})

describe('npm fetchers', () => {
  test('request the documented endpoints and use the abbreviated accept header for packages', async () => {
    const seen: {url: string; accept?: string}[] = []
    const fetchImpl = routeFetch(
      {
        'https://registry.npmjs.org/sanity': loadRawFixture('npm-packument'),
        'https://registry.npmjs.org/@sanity%2Fvalidation': {versions: {'6.12.0': {}}},
        'https://registry.npmjs.org/-/package/sanity/dist-tags': {
          latest: '6.24.0',
          stable: '6.15.0',
        },
        'https://api.npmjs.org/versions/sanity/last-week': loadRawFixture('npm-downloads'),
      },
      seen,
    )
    expect((await fetchSanityVersions(fetchImpl)).length).toBeGreaterThan(5)
    expect(await fetchPackageVersions(fetchImpl, '@sanity/validation')).toEqual(['6.12.0'])
    expect(await fetchDistTags(fetchImpl)).toEqual({latest: '6.24.0', stable: '6.15.0'})
    expect(Object.keys(await fetchLastWeekDownloads(fetchImpl))).toContain('6.23.0')
    expect(seen.find((entry) => entry.url.includes('validation'))?.accept).toBe(
      'application/vnd.npm.install-v1+json',
    )
  })

  test('throws on a failed response', async () => {
    await expect(fetchDistTags(routeFetch({}))).rejects.toThrow(/404/)
  })
})
