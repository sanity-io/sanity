import resolveFrom from 'resolve-from'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {compareDependencyVersions} from '../compareDependencyVersions'
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

const appAutoUpdatesImports = {
  '@sanity/sdk-react': 'v1/modules/@sanity__sdk-react',
  '@sanity/sdk-react/': 'v1/modules/@sanity__sdk-react/',
  '@sanity/sdk': 'v1/modules/@sanity__sdk',
  '@sanity/sdk/': 'v1/modules/@sanity__sdk/',
}

describe('compareDependencyVersions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  describe('for studio', () => {
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

      const result = await compareDependencyVersions(
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

      const result = await compareDependencyVersions(
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

      const result = await compareDependencyVersions(
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

      const result = await compareDependencyVersions(
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

      const result = await compareDependencyVersions(
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

  describe('for app', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should return empty array if versions match', async () => {
      mockedFetch.mockResolvedValue({
        headers: {
          get: vi.fn<(name: string) => string | null>().mockReturnValue('0.1.0'),
        },
      })
      vi.mocked(mockedResolveFrom.silent)
        .mockReturnValueOnce('/test/workdir/node_modules/@sanity/sdk-react/package.json')
        .mockReturnValueOnce('/test/workdir/node_modules/@sanity/sdk/package.json')
      mockedReadPackageManifest
        .mockResolvedValueOnce({
          dependencies: {
            '@sanity/sdk-react': '^0.1.0',
            '@sanity/sdk': '^0.1.0',
          },
          devDependencies: {},
          name: 'test-package',
          version: '0.0.0',
        })
        .mockResolvedValueOnce({
          dependencies: {},
          devDependencies: {},
          name: '@sanity/sdk-react',
          version: '0.1.0',
        })
        .mockResolvedValueOnce({
          dependencies: {},
          devDependencies: {},
          name: '@sanity/sdk',
          version: '0.1.0',
        })

      const result = await compareDependencyVersions(
        appAutoUpdatesImports,
        '/test/workdir',
        mockedFetch,
      )

      expect(result).toEqual([])
    })

    it('should return one item in array if versions mismatches for one pkg', async () => {
      mockedFetch.mockResolvedValue({
        headers: {
          get: vi.fn<(name: string) => string | null>().mockReturnValue('0.1.0'),
        },
      })
      vi.mocked(mockedResolveFrom.silent)
        .mockReturnValueOnce('/test/workdir/node_modules/@sanity/sdk-react/package.json')
        .mockReturnValueOnce('/test/workdir/node_modules/@sanity/sdk/package.json')
      mockedReadPackageManifest
        .mockResolvedValueOnce({
          dependencies: {
            '@sanity/sdk-react': '^0.1.0',
            '@sanity/sdk': '^0.1.0',
          },
          devDependencies: {},
          name: 'test-package',
          version: '0.0.0',
        })
        .mockResolvedValueOnce({
          dependencies: {},
          devDependencies: {},
          name: '@sanity/sdk-react',
          version: '0.0.0',
        })
        .mockResolvedValueOnce({
          dependencies: {},
          devDependencies: {},
          name: '@sanity/sdk',
          version: '0.1.0',
        })

      const result = await compareDependencyVersions(
        appAutoUpdatesImports,
        '/test/workdir',
        mockedFetch,
      )

      expect(result).toEqual([
        {
          pkg: '@sanity/sdk-react',
          installed: '0.0.0',
          remote: '0.1.0',
        },
      ])
    })
    it('should return multiple items in array if versions mismatches for more pkg', async () => {
      mockedFetch.mockResolvedValue({
        headers: {
          get: vi.fn<(name: string) => string | null>().mockReturnValue('0.2.0'),
        },
      })
      vi.mocked(mockedResolveFrom.silent)
        .mockReturnValueOnce('/test/workdir/node_modules/@sanity/sdk-react/package.json')
        .mockReturnValueOnce('/test/workdir/node_modules/@sanity/sdk/package.json')
      mockedReadPackageManifest
        .mockResolvedValueOnce({
          dependencies: {
            '@sanity/sdk-react': '^0.1.0',
            '@sanity/sdk': '^0.1.0',
          },
          devDependencies: {},
          name: 'test-package',
          version: '0.0.0',
        })
        .mockResolvedValueOnce({
          dependencies: {},
          devDependencies: {},
          name: '@sanity/sdk-react',
          version: '0.1.0',
        })
        .mockResolvedValueOnce({
          dependencies: {},
          devDependencies: {},
          name: '@sanity/sdk',
          version: '0.1.0',
        })

      const result = await compareDependencyVersions(
        appAutoUpdatesImports,
        '/test/workdir',
        mockedFetch,
      )

      expect(result).toEqual([
        {
          pkg: '@sanity/sdk-react',
          installed: '0.1.0',
          remote: '0.2.0',
        },
        {
          pkg: '@sanity/sdk',
          installed: '0.1.0',
          remote: '0.2.0',
        },
      ])
    })

    it("should warn if the user's package.json version is greater then remote", async () => {
      mockedFetch.mockResolvedValue({
        headers: {
          get: vi.fn<(name: string) => string | null>().mockReturnValue('0.1.0'),
        },
      })
      vi.mocked(mockedResolveFrom.silent)
        .mockReturnValueOnce('/test/workdir/node_modules/@sanity/sdk-react/package.json')
        .mockReturnValueOnce('/test/workdir/node_modules/@sanity/sdk/package.json')
      mockedReadPackageManifest
        .mockResolvedValueOnce({
          dependencies: {
            '@sanity/sdk-react': '^0.1.0',
            '@sanity/sdk': '^0.1.0',
          },
          devDependencies: {},
          name: 'test-package',
          version: '0.0.0',
        })
        .mockResolvedValueOnce({
          dependencies: {},
          devDependencies: {},
          name: '@sanity/sdk-react',
          version: '0.2.0',
        })
        .mockResolvedValueOnce({
          dependencies: {},
          devDependencies: {},
          name: '@sanity/sdk',
          version: '0.2.0',
        })

      const result = await compareDependencyVersions(
        appAutoUpdatesImports,
        '/test/workdir',
        mockedFetch,
      )

      expect(result).toEqual([
        {
          pkg: '@sanity/sdk-react',
          installed: '0.2.0',
          remote: '0.1.0',
        },
        {
          pkg: '@sanity/sdk',
          installed: '0.2.0',
          remote: '0.1.0',
        },
      ])
    })

    it("should read from user's package.json if resolveFrom fails to find package.json in node_modules", async () => {
      mockedFetch.mockResolvedValue({
        headers: {
          get: vi.fn<(name: string) => string | null>().mockReturnValue('0.1.0'),
        },
      })
      mockedReadPackageManifest.mockResolvedValueOnce({
        dependencies: {
          '@sanity/sdk-react': '^0.0.0',
          '@sanity/sdk': '^0.0.0',
        },
        devDependencies: {},
        name: 'test-package',
        version: '0.0.0',
      })

      const result = await compareDependencyVersions(
        appAutoUpdatesImports,
        '/test/workdir',
        mockedFetch,
      )

      expect(mockedReadPackageManifest).toHaveBeenCalledTimes(1)

      expect(result).toEqual([
        {
          pkg: '@sanity/sdk-react',
          installed: '0.0.0',
          remote: '0.1.0',
        },
        {
          pkg: '@sanity/sdk',
          installed: '0.0.0',
          remote: '0.1.0',
        },
      ])
    })
  })
})
