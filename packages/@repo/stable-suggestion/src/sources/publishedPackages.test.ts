import path from 'node:path'

import {describe, expect, test} from 'vitest'

import {listPublishedPackageNames, parseDirectories} from './publishedPackages'

describe('publishedPackages', () => {
  test('parses the space separated directories the script prints', () => {
    expect(parseDirectories('packages/sanity packages/groq\n')).toEqual([
      'packages/sanity',
      'packages/groq',
    ])
    expect(parseDirectories('')).toEqual([])
  })

  test('reads each manifest name and sorts them', () => {
    const names = listPublishedPackageNames({
      repoRoot: '/repo',
      listDirectories: () => 'packages/sanity packages/@sanity/types',
      readManifest: (manifestPath) =>
        manifestPath === path.join('/repo', 'packages/sanity', 'package.json')
          ? '{"name":"sanity"}'
          : '{"name":"@sanity/types"}',
    })
    expect(names).toEqual(['@sanity/types', 'sanity'])
  })

  test('throws when a manifest has no name', () => {
    expect(() =>
      listPublishedPackageNames({
        repoRoot: '/repo',
        listDirectories: () => 'packages/x',
        readManifest: () => '{}',
      }),
    ).toThrow(/no name/)
  })
})
