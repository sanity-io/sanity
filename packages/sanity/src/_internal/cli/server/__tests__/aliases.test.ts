import path from 'node:path'

import {escapeRegExp} from 'lodash'
import * as resolve from 'resolve.exports'
import {type Alias} from 'vite'
import {describe, expect, it, vi} from 'vitest'

import {
  browserCompatibleSanityPackageSpecifiers,
  getSanityPkgExportAliases,
} from '../getBrowserAliases'
import {getMonorepoAliases} from '../sanityMonorepo'

const sanityPkgPath = path.resolve(__dirname, '../../../../../package.json')

const pkg = await import(sanityPkgPath)

vi.mock(import('resolve.exports'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    default: actual,
    exports: actual.exports,
  }
})

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
      'sanity/media-library',
      'sanity/migrate',
      'sanity/package.json',
      'sanity/presentation',
      'sanity/router',
      'sanity/structure',
      'sanity/ui-components',
    ])

    expect(browserCompatibleSanityPackageSpecifiers).toHaveLength(9)

    for (const specifier of browserCompatibleSanityPackageSpecifiers) {
      expect(currentSpecifiers).toContain(specifier)
    }
  })
})

describe('getAliases', () => {
  // TODO: this test would be better if it called `vite.build` with fixtures
  // but vite does not seem to be compatible in our jest environment.
  // Error from trying to import vite:
  //
  // > Invariant violation: "new TextEncoder().encode("") instanceof Uint8Array" is incorrectly false
  // >
  // > This indicates that your JavaScript environment is broken. You cannot use
  // > esbuild in this environment because esbuild relies on this invariant. This
  // > is not a problem with esbuild. You need to fix your environment instead.
  it('returns the correct aliases for normal builds', () => {
    const aliases = getSanityPkgExportAliases(sanityPkgPath)

    // Prepare expected aliases
    const dirname = path.dirname(sanityPkgPath)
    const expectedAliases = browserCompatibleSanityPackageSpecifiers.reduce<Alias[]>(
      (acc, next) => {
        const dest = resolve.exports(pkg, next, {
          browser: true,
        })?.[0]
        if (dest) {
          acc.push({
            find: new RegExp(`^${escapeRegExp(next)}$`),
            replacement: path.resolve(dirname, dest),
          })
        }
        return acc
      },
      [],
    )

    expect(aliases).toEqual(expectedAliases)
  })

  it('returns the correct aliases for the monorepo', async () => {
    const monorepoPath = '/path/to/monorepo'
    const devAliases = {
      'sanity/_singletons': 'sanity/src/_singletons.ts',
      'sanity/desk': 'sanity/src/desk.ts',
      'sanity/presentation': 'sanity/src/presentation.ts',
    }

    const expectedAliases = {
      'sanity/_singletons': '/path/to/monorepo/packages/sanity/src/_singletons.ts',
      'sanity/desk': '/path/to/monorepo/packages/sanity/src/desk.ts',
      'sanity/presentation': '/path/to/monorepo/packages/sanity/src/presentation.ts',
    }

    vi.doMock('@repo/dev-aliases', () => {
      return {
        default: devAliases,
      }
    })

    const aliases = await getMonorepoAliases(monorepoPath)

    expect(aliases).toMatchObject(expectedAliases)
  })
})
