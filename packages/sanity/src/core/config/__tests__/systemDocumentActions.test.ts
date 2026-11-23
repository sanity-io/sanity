import {describe, expect, it} from 'vitest'

import {getMockSource} from '../../../../test/testUtils/getMockWorkspaceFromConfig'
import {RELEASE_DOCUMENT_TYPE} from '../../releases/store/constants'
import {VARIANT_DOCUMENT_TYPE} from '../../variants/store/constants'

describe('document actions on release and variant definitions', () => {
  it('stay empty after every default plugin that adds actions to drafts', async () => {
    const source = await getMockSource({
      config: {
        // Scheduled publishing is only included next to another plugin
        plugins: [{name: 'some-plugin'}],
        scheduledPublishing: {enabled: true},
        scheduledDrafts: {enabled: true},
        beta: {variants: {enabled: true}},
      },
    })

    const context = {versionType: 'draft', releaseId: undefined} as const
    expect(
      source.document.actions({...context, schemaType: 'author', documentId: 'someAuthor'}),
    ).not.toHaveLength(0)
    expect(
      source.document.actions({
        ...context,
        schemaType: RELEASE_DOCUMENT_TYPE,
        documentId: '_.releases.spring',
      }),
    ).toEqual([])
    expect(
      source.document.actions({
        ...context,
        schemaType: VARIANT_DOCUMENT_TYPE,
        documentId: '_.variants.loyal',
      }),
    ).toEqual([])
  })
})
