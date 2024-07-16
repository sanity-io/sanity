import path from 'node:path'

import {describe, expect, it, jest} from '@jest/globals'
import resolve from 'resolve.exports'

import {browserCompatibleSanityPackageSpecifiers, getAliases} from '../aliases'

const sanityPkgPath = path.resolve(__dirname, '../../../../../package.json')
// eslint-disable-next-line import/no-dynamic-require
const pkg = require(sanityPkgPath)

describe('browserCompatibleSanityPackageSpecifiers', () => {
  it('should have all specifiers listed in the package.json', () => {
    const currentSpecifiers = Object.keys(pkg.exports)
      .map((subpath) => path.join('sanity', subpath))
      .sort()

    // NOTE: this test is designed to fail if there are any changes to the
    // package exports in the sanity package.json so you can stop and consider if that
    // new subpath should also go into `browserCompatibleSanityPackageSpecifiers`.
    // If there are changes, you may need to update this variable. New subpaths
    // should go into `browserCompatibleSanityPackageSpecifiers` if that subpath
    // is meant to be imported in the browser (e.g. a new subpath that is only meant
    // for the CLI doesn't need to go into `browserCompatibleSanityPackageSpecifiers`).
    expect(currentSpecifiers).toEqual([
      'sanity',
      'sanity/_createContext',
      'sanity/_internal',
      'sanity/_singletons',
      'sanity/cli',
      'sanity/desk',
      'sanity/migrate',
      'sanity/package.json',
      'sanity/presentation',
      'sanity/router',
      'sanity/structure',
    ])

    expect(browserCompatibleSanityPackageSpecifiers).toHaveLength(8)

    for (const specifier of browserCompatibleSanityPackageSpecifiers) {
      expect(currentSpecifiers).toContain(specifier)
    }
  })
})

describe('getAliases', () => {
  it('returns the correct aliases for normal builds', () => {
    const aliases = getAliases({
      sanityPkgPath,
      conditions: ['import', 'browser'],
      browser: true,
    })

    const expectedAliases = browserCompatibleSanityPackageSpecifiers.reduce<Record<string, string>>(
      (acc, specifier) => {
        const dest = resolve.exports(pkg, specifier, {
          browser: true,
          conditions: ['import', 'browser'],
        })?.[0]
        if (dest) {
          acc[specifier] = path.resolve(path.dirname(sanityPkgPath), dest)
        }
        return acc
      },
      {},
    )

    expect(aliases).toMatchObject(expectedAliases)
  })

  it('returns the correct aliases for the monorepo', () => {
    const monorepoPath = path.resolve(__dirname, '../../../../../monorepo')
    const devAliases = {
      'sanity/_singletons': 'packages/sanity/src/_singletons.ts',
      'sanity/desk': 'packages/sanity/src/desk.ts',
      'sanity/presentation': 'packages/sanity/src/presentation.ts',
    }
    jest.doMock(path.resolve(monorepoPath, 'dev/aliases.cjs'), () => devAliases, {virtual: true})

    const aliases = getAliases({
      monorepo: {path: monorepoPath},
    })

    const expectedAliases = Object.fromEntries(
      Object.entries(devAliases).map(([key, modulePath]) => {
        return [key, path.resolve(monorepoPath, modulePath)]
      }),
    )

    expect(aliases).toMatchObject(expectedAliases)
  })
})
