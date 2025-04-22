import resolveFrom from 'resolve-from'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {compareStudioDependencyVersions} from '../compareStudioDependencyVersions'
import {readPackageManifest} from '../readPackageManifest'

vi.mock('resolve-from')
vi.mock('../readPackageManifest')

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockedFetch = vi.fn()
const mockedResolveFrom = vi.mocked(resolveFrom)
const mockedReadPackageManifest = vi.mocked(readPackageManifest)

const autoUpdatesImports = {
  'sanity': 'v1/modules/sanity',
  'sanity/': 'v1/modules/sanity/',
  '@sanity/vision': 'v1/modules/@sanity__vision',
  '@sanity/vision/': 'v1/modules/@sanity__vision/',
}

describe('compareStudioDependencyVersions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return empty array if versions match', async () => {
    mockedFetch.mockResolvedValue({
      headers: {
        get: vi.fn<(name: string) => string | null>().mockReturnValue('3.40.0'),
      },
    })
    vi.mocked(mockedResolveFrom.silent)
      .mockReturnValueOnce('/test/workdir/node_modules/sanity/package.json')
      .mockReturnValueOnce('/test/workdir/node_modules/@sanity/vision/package.json')
    mockedReadPackageManifest
      .mockResolvedValueOnce({
        dependencies: {
          'sanity': '^3.40.0',
          '@sanity/vision': '^3.40.0',
        },
        devDependencies: {},
        name: 'test-package',
        version: '0.0.0',
      })
      .mockResolvedValueOnce({
        dependencies: {},
        devDependencies: {},
        name: 'sanity',
        version: '3.40.0',
      })
      .mockResolvedValueOnce({
        dependencies: {},
        devDependencies: {},
        name: '@sanity/vision',
        version: '3.40.0',
      })

    const result = await compareStudioDependencyVersions(
      autoUpdatesImports,
      '/test/workdir',
      mockedFetch,
    )

    expect(result).toEqual([])
  })

  it('should return one item in array if versions mismatches for one pkg', async () => {
    mockedFetch.mockResolvedValue({
      headers: {
        get: vi.fn<(name: string) => string | null>().mockReturnValue('3.40.0'),
      },
    })
    vi.mocked(mockedResolveFrom.silent)
      .mockReturnValueOnce('/test/workdir/node_modules/sanity/package.json')
      .mockReturnValueOnce('/test/workdir/node_modules/@sanity/vision/package.json')
    mockedReadPackageManifest
      .mockResolvedValueOnce({
        dependencies: {
          'sanity': '^3.40.0',
          '@sanity/vision': '^3.40.0',
        },
        devDependencies: {},
        name: 'test-package',
        version: '0.0.0',
      })
      .mockResolvedValueOnce({
        dependencies: {},
        devDependencies: {},
        name: 'sanity',
        version: '3.30.0',
      })
      .mockResolvedValueOnce({
        dependencies: {},
        devDependencies: {},
        name: '@sanity/vision',
        version: '3.40.0',
      })

    const result = await compareStudioDependencyVersions(
      autoUpdatesImports,
      '/test/workdir',
      mockedFetch,
    )

    expect(result).toEqual([
      {
        pkg: 'sanity',
        installed: '3.30.0',
        remote: '3.40.0',
      },
    ])
  })
  it('should return multiple items in array if versions mismatches for more pkg', async () => {
    mockedFetch.mockResolvedValue({
      headers: {
        get: vi.fn<(name: string) => string | null>().mockReturnValue('3.40.0'),
      },
    })
    vi.mocked(mockedResolveFrom.silent)
      .mockReturnValueOnce('/test/workdir/node_modules/sanity/package.json')
      .mockReturnValueOnce('/test/workdir/node_modules/@sanity/vision/package.json')
    mockedReadPackageManifest
      .mockResolvedValueOnce({
        dependencies: {
          'sanity': '^3.40.0',
          '@sanity/vision': '^3.40.0',
        },
        devDependencies: {},
        name: 'test-package',
        version: '0.0.0',
      })
      .mockResolvedValueOnce({
        dependencies: {},
        devDependencies: {},
        name: 'sanity',
        version: '3.30.0',
      })
      .mockResolvedValueOnce({
        dependencies: {},
        devDependencies: {},
        name: '@sanity/vision',
        version: '3.30.0',
      })

    const result = await compareStudioDependencyVersions(
      autoUpdatesImports,
      '/test/workdir',
      mockedFetch,
    )

    expect(result).toEqual([
      {
        pkg: 'sanity',
        installed: '3.30.0',
        remote: '3.40.0',
      },
      {
        pkg: '@sanity/vision',
        installed: '3.30.0',
        remote: '3.40.0',
      },
    ])
  })

  it("should warn if the user's package.json version is greater then remote", async () => {
    mockedFetch.mockResolvedValue({
      headers: {
        get: vi.fn<(name: string) => string | null>().mockReturnValue('3.40.0'),
      },
    })
    vi.mocked(mockedResolveFrom.silent)
      .mockReturnValueOnce('/test/workdir/node_modules/sanity/package.json')
      .mockReturnValueOnce('/test/workdir/node_modules/@sanity/vision/package.json')
    mockedReadPackageManifest
      .mockResolvedValueOnce({
        dependencies: {
          'sanity': '^3.40.0',
          '@sanity/vision': '^3.40.0',
        },
        devDependencies: {},
        name: 'test-package',
        version: '0.0.0',
      })
      .mockResolvedValueOnce({
        dependencies: {},
        devDependencies: {},
        name: 'sanity',
        version: '3.50.0',
      })
      .mockResolvedValueOnce({
        dependencies: {},
        devDependencies: {},
        name: '@sanity/vision',
        version: '3.40.0',
      })

    const result = await compareStudioDependencyVersions(
      autoUpdatesImports,
      '/test/workdir',
      mockedFetch,
    )

    expect(result).toEqual([
      {
        pkg: 'sanity',
        installed: '3.50.0',
        remote: '3.40.0',
      },
    ])
  })

  it("should read from user's package.json if resolveFrom fails to find package.json in node_modules", async () => {
    mockedFetch.mockResolvedValue({
      headers: {
        get: vi.fn<(name: string) => string | null>().mockReturnValue('3.40.0'),
      },
    })
    mockedReadPackageManifest.mockResolvedValueOnce({
      dependencies: {
        'sanity': '^3.20.0',
        '@sanity/vision': '^3.20.0',
      },
      devDependencies: {},
      name: 'test-package',
      version: '0.0.0',
    })

    const result = await compareStudioDependencyVersions(
      autoUpdatesImports,
      '/test/workdir',
      mockedFetch,
    )

    expect(mockedReadPackageManifest).toHaveBeenCalledTimes(1)

    expect(result).toEqual([
      {
        pkg: 'sanity',
        installed: '3.20.0',
        remote: '3.40.0',
      },
      {
        pkg: '@sanity/vision',
        installed: '3.20.0',
        remote: '3.40.0',
      },
    ])
  })
})
