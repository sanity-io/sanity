import {beforeEach, describe, expect, it, jest} from '@jest/globals'
import resolveFrom from 'resolve-from'

import {compareStudioDependencyVersions} from '../compareStudioDependencyVersions'
import {readPackageJson} from '../readPackageJson'

jest.mock('resolve-from')
jest.mock('../readPackageJson')

global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockedFetch = global.fetch as jest.MockedFunction<any>
const mockedResolveFrom = resolveFrom as jest.MockedFunction<typeof resolveFrom>
const mockedReadPackageJson = readPackageJson as jest.MockedFunction<typeof readPackageJson>

const autoUpdatesImports = {
  'sanity': 'v1/modules/sanity',
  'sanity/': 'v1/modules/sanity/',
  '@sanity/vision': 'v1/modules/@sanity__vision',
  '@sanity/vision/': 'v1/modules/@sanity__vision/',
}

describe('compareStudioDependencyVersions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return empty array if versions match', async () => {
    mockedFetch.mockResolvedValue({
      headers: {
        get: jest.fn<(name: string) => string | null>().mockReturnValue('3.40.0'),
      },
    })
    mockedResolveFrom.silent
      .mockReturnValueOnce('/test/workdir/node_modules/sanity/package.json')
      .mockReturnValueOnce('/test/workdir/node_modules/@sanity/vision/package.json')
    mockedReadPackageJson
      .mockReturnValueOnce({
        dependencies: {
          'sanity': '^3.40.0',
          '@sanity/vision': '^3.40.0',
        },
        devDependencies: {},
        name: 'test-package',
        version: '0.0.0',
      })
      .mockReturnValueOnce({
        name: 'sanity',
        version: '3.40.0',
      })
      .mockReturnValueOnce({
        name: '@sanity/vision',
        version: '3.40.0',
      })

    const result = await compareStudioDependencyVersions(autoUpdatesImports, '/test/workdir')

    expect(result).toEqual([])
  })

  it('should return one item in array if versions mismatches for one pkg', async () => {
    mockedFetch.mockResolvedValue({
      headers: {
        get: jest.fn<(name: string) => string | null>().mockReturnValue('3.40.0'),
      },
    })
    mockedResolveFrom.silent
      .mockReturnValueOnce('/test/workdir/node_modules/sanity/package.json')
      .mockReturnValueOnce('/test/workdir/node_modules/@sanity/vision/package.json')
    mockedReadPackageJson
      .mockReturnValueOnce({
        dependencies: {
          'sanity': '^3.40.0',
          '@sanity/vision': '^3.40.0',
        },
        devDependencies: {},
        name: 'test-package',
        version: '0.0.0',
      })
      .mockReturnValueOnce({
        name: 'sanity',
        version: '3.30.0',
      })
      .mockReturnValueOnce({
        name: '@sanity/vision',
        version: '3.40.0',
      })

    const result = await compareStudioDependencyVersions(autoUpdatesImports, '/test/workdir')

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
        get: jest.fn<(name: string) => string | null>().mockReturnValue('3.40.0'),
      },
    })
    mockedResolveFrom.silent
      .mockReturnValueOnce('/test/workdir/node_modules/sanity/package.json')
      .mockReturnValueOnce('/test/workdir/node_modules/@sanity/vision/package.json')
    mockedReadPackageJson
      .mockReturnValueOnce({
        dependencies: {
          'sanity': '^3.40.0',
          '@sanity/vision': '^3.40.0',
        },
        devDependencies: {},
        name: 'test-package',
        version: '0.0.0',
      })
      .mockReturnValueOnce({
        name: 'sanity',
        version: '3.30.0',
      })
      .mockReturnValueOnce({
        name: '@sanity/vision',
        version: '3.30.0',
      })

    const result = await compareStudioDependencyVersions(autoUpdatesImports, '/test/workdir')

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

  it("should read from user's package.json if resolveFrom fails to find package.json in node_modules", async () => {
    mockedFetch.mockResolvedValue({
      headers: {
        get: jest.fn<(name: string) => string | null>().mockReturnValue('3.40.0'),
      },
    })
    mockedReadPackageJson.mockReturnValueOnce({
      dependencies: {
        'sanity': '^3.20.0',
        '@sanity/vision': '^3.20.0',
      },
      devDependencies: {},
      name: 'test-package',
      version: '0.0.0',
    })

    const result = await compareStudioDependencyVersions(autoUpdatesImports, '/test/workdir')

    expect(readPackageJson).toHaveBeenCalledTimes(1)

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
