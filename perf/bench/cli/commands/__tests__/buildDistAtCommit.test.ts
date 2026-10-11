import {describe, expect, it} from 'vitest'
import {parse} from 'yaml'

import {
  packedDirectDependencies,
  sparseCheckoutPaths,
  tarballFilename,
  withOverrides,
} from '../buildDistAtCommit'

describe('tarballFilename', () => {
  it('matches pnpm pack naming for scoped and unscoped packages', () => {
    expect(tarballFilename('sanity', '6.12.0')).toBe('sanity-6.12.0.tgz')
    expect(tarballFilename('@sanity/types', '6.12.0')).toBe('sanity-types-6.12.0.tgz')
  })
})

describe('withOverrides', () => {
  const yaml = [
    'packages:',
    '  - perf/*',
    '',
    '# keep vitest on the catalog version',
    'overrides:',
    "  vitest: 'catalog:'",
    '',
    'preferWorkspacePackages: true',
    '',
  ].join('\n')

  it('merges into an existing overrides block, keeping its entries and the rest of the file', () => {
    const result = withOverrides(yaml, {
      'sanity': 'file:/t/sanity.tgz',
      '@sanity/types': 'file:/t/types.tgz',
    })
    expect(parse(result)).toEqual({
      packages: ['perf/*'],
      overrides: {
        'vitest': 'catalog:',
        'sanity': 'file:/t/sanity.tgz',
        '@sanity/types': 'file:/t/types.tgz',
      },
      preferWorkspacePackages: true,
    })
    expect(result).toContain('# keep vitest on the catalog version')
  })

  it('creates the block when there is none', () => {
    expect(parse(withOverrides('packages:\n  - perf/*\n', {sanity: 'file:/t/sanity.tgz'}))).toEqual(
      {
        packages: ['perf/*'],
        overrides: {sanity: 'file:/t/sanity.tgz'},
      },
    )
  })
})

describe('packedDirectDependencies', () => {
  it('returns the manifest dependencies a tarball replaces, across dependency kinds', () => {
    const manifest = {
      name: 'bench',
      dependencies: {
        'sanity': 'workspace:*',
        'react': 'catalog:',
        '@sanity/mutator': 'workspace:*',
      },
      devDependencies: {'@sanity/types': 'workspace:*', 'vitest': 'catalog:'},
    }
    expect(
      packedDirectDependencies(
        manifest,
        new Set(['sanity', '@sanity/mutator', '@sanity/types', '@sanity/schema']),
      ),
    ).toEqual(['@sanity/mutator', '@sanity/types', 'sanity'])
  })

  it('is empty when nothing packed is a direct dependency', () => {
    expect(
      packedDirectDependencies({name: 'x', dependencies: {react: '19'}}, new Set(['sanity'])),
    ).toEqual([])
  })
})

describe('sparseCheckoutPaths', () => {
  const projects = [
    {name: 'sanity-root', version: '6.0.0', path: '/repo', private: true},
    {name: 'bench', version: '6.0.0', path: '/repo/perf/bench', private: true},
    {name: '@repo/utils', version: '6.0.0', path: '/repo/packages/@repo/utils', private: true},
    // Listed twice on purpose: a project selected by both filters must come out once
    {name: '@repo/utils', version: '6.0.0', path: '/repo/packages/@repo/utils', private: true},
    {name: 'sanity', version: '6.0.0', path: '/repo/packages/sanity'},
    {name: '@sanity/types', version: '6.0.0', path: '/repo/packages/@sanity/types'},
  ]

  it('lists repo-relative dirs without the root, the replaced packages, or duplicates', () => {
    expect(
      sparseCheckoutPaths(projects, {
        repoRoot: '/repo',
        replaced: new Set(['sanity', '@sanity/types']),
      }),
    ).toEqual(['packages/@repo/utils', 'perf/bench'])
  })

  it('rejects a project outside the repo root', () => {
    expect(() =>
      sparseCheckoutPaths([{name: 'x', version: '1.0.0', path: '/elsewhere/x'}], {
        repoRoot: '/repo',
        replaced: new Set(),
      }),
    ).toThrow(/outside/)
  })

  it('keeps workspace packages that no tarball replaces', () => {
    expect(
      sparseCheckoutPaths(projects, {repoRoot: '/repo', replaced: new Set(['sanity'])}),
    ).toEqual(['packages/@repo/utils', 'packages/@sanity/types', 'perf/bench'])
  })
})
