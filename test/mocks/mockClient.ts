/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
//
// NOTE: the purpose of this mock client is so modules that require a client
// can still resolve and run by default. However, if you wish to test a specific
// part of your code, you should not rely on the implementation details of this
// client and instead mock your own by:
//
// 1. using the `moduleNameMapper` replacing `part:@sanity/base/client` in the
//    project jest.config.js file or
// 2. mocking per test file using `jest.mock('part:@sanity/base/client', () => {})`

import {NEVER} from 'rxjs'
import type {ClientConfig} from '@sanity/client'

const mockConfig: ClientConfig = {
  useCdn: false,
  projectId: 'mock-project-id',
  dataset: 'mock-data-set',
  apiVersion: '1',
}

const mockClient = {
  withConfig: () => mockClient,
  constructor: () => mockClient,
  config: (config: any) => (config ? mockClient : mockConfig),
  clone: () => mockClient,
  fetch: () => Promise.resolve(null),
  request: () => Promise.resolve(null),
  observable: {
    fetch: () => NEVER,
    listen: () => NEVER,
  },
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  listen: () => NEVER,
}

export default mockClient
