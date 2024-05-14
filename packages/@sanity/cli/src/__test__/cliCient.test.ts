import {afterAll, beforeAll, describe, expect, it, jest} from '@jest/globals'

import {getCliClient} from '../cliClient'
import {type CliConfig} from '../types'
import {resolveRootDir} from '../util/resolveRootDir'

jest.mock('@sanity/client', () => ({
  // create a mock that only implements the `config()` method
  createClient: jest.fn((config) => ({config: () => config})),
}))

jest.mock('../util/resolveRootDir', () => ({
  resolveRootDir: jest.fn((dir) => dir || 'MOCK_ROOT_DIR'),
}))

jest.mock('../util/getCliConfig', () => {
  const mockCliConfig: CliConfig = {
    api: {
      dataset: 'dataset-from-mock-config',
      projectId: 'project-from-mock-config',
    },
  }

  return {
    getCliConfigSync: jest.fn((rootDir: string) => ({
      config: mockCliConfig,
      path: `${rootDir}/sanity.cli.ts`,
      version: 3,
    })),
  }
})

beforeAll(() => {
  // eslint-disable-next-line camelcase
  Object.assign(getCliClient, {__internal__getToken: () => 'test-token'})
})

afterAll(() => {
  jest.resetAllMocks()
})

describe('getCliClient', () => {
  it('creates a sanity client with defaults for useCdn, apiVersion, and token if projectId and dataset are provided', () => {
    const client = getCliClient({
      projectId: 'myproject',
      dataset: 'test',
      perspective: 'published',
    })

    expect(client.config()).toMatchObject({
      projectId: 'myproject',
      dataset: 'test',
      perspective: 'published',
      apiVersion: '2022-06-06',
      useCdn: false,
      token: 'test-token',
    })
  })

  it('creates a sanity client using the config file if no projectId or dataset was provided', () => {
    const client = getCliClient({
      perspective: 'published',
      cwd: 'ANOTHER_ROOT_DIR',
    })

    expect(resolveRootDir).toHaveBeenCalledWith('ANOTHER_ROOT_DIR')

    expect(client.config()).toMatchObject({
      projectId: 'project-from-mock-config',
      dataset: 'dataset-from-mock-config',
      perspective: 'published',
      apiVersion: '2022-06-06',
      useCdn: false,
      token: 'test-token',
    })
  })
})
