import {expect, test} from 'vitest'

import {endpoints} from '../endpoints'
import {toFetchOptions} from '../sanityRequestOptions'

test('toFetchOptions', () => {
  expect(
    toFetchOptions({
      projectId: 'xyz',
      apiVersion: 'v2025-01-31',
      apiHost: 'api.sanity.io',
      endpoint: endpoints.data.query('my-dataset'),
    }),
  ).toEqual({
    init: {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': expect.stringMatching(/^@sanity\/migrate@3\./),
      },
      method: 'GET',
    },
    url: 'https://xyz.api.sanity.io//v2025-01-31/query/my-dataset?perspective=raw',
  })
})
