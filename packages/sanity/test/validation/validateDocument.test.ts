import {type Rule, type SanityDocument} from '@sanity/types'
import {validateDocument as validateHeadlessDocument} from '@sanity/validation'
import {describe, expect, it, vi} from 'vitest'

import {type Workspace} from '../../src/core/config'
import {getFallbackLocaleSource} from '../../src/core/i18n/fallback'
import {createSchema} from '../../src/core/schema/createSchema'
import {validateDocument} from '../../src/core/validation/validateDocument'
import {createMockSanityClient} from './mocks/mockSanityClient'

describe('validateDocument', () => {
  it('adapts the workspace and preserves marker parity with headless validation', async () => {
    const schema = createSchema({
      name: 'default',
      types: [
        {
          name: 'article',
          type: 'document',
          fields: [
            {
              name: 'title',
              type: 'string',
              validation: (rule: Rule) => rule.required().min(10),
            },
          ],
        },
      ],
    })
    const document: SanityDocument = {
      _createdAt: '2026-01-01T00:00:00.000Z',
      _id: 'article-id',
      _rev: 'revision',
      _type: 'article',
      _updatedAt: '2026-01-01T00:00:00.000Z',
      title: 'Short',
    }
    const client = createMockSanityClient() as any
    const fallbackI18n = getFallbackLocaleSource()
    const i18n = {...fallbackI18n, t: vi.fn(fallbackI18n.t)}
    const workspace = {
      getClient: () => client,
      i18n,
      schema,
    } as Workspace

    const [headlessMarkers, studioMarkers] = await Promise.all([
      validateHeadlessDocument({client, document, schema}),
      validateDocument({document, workspace}),
    ])

    expect(studioMarkers).toEqual(headlessMarkers)
    expect(i18n.t).toHaveBeenCalledWith('validation:string.minimum-length', {minLength: 10})
  })
})
