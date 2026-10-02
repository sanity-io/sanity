import {createClient} from '@sanity/client'

import {createSourceFromConfig} from '../../src/core/config/resolveConfig'
import {type SingleWorkspace, type Source} from '../../src/core/config/types'
import {createMockAuthStore} from '../../src/core/store/authStore/createMockAuthStore'

/**
 * A `Source` from a minimal single-workspace config. The projectId is randomised per call so the
 * module-level config warning dedupe does not bleed across cases.
 */
export function createTestSource(overrides: Partial<SingleWorkspace> = {}): Promise<Source> {
  const projectId = `test-source-${Math.random().toString(36).slice(2)}`
  const dataset = 'test'

  return createSourceFromConfig({
    name: 'test',
    basePath: '/',
    projectId,
    dataset,
    schema: {
      types: [{name: 'author', type: 'document', fields: [{name: 'title', type: 'string'}]}],
    },
    auth: createMockAuthStore({
      client: createClient({projectId, dataset, apiVersion: '2021-06-07', useCdn: false}),
      currentUser: null,
    }),
    ...overrides,
  })
}
