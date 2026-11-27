import {type ReleaseDocument} from '@sanity/client'
import {defineField, defineType} from '@sanity/types'
import {describe, expect, it} from 'vitest'

import {
  activeASAPRelease,
  activeCardinalityOneRelease,
  scheduledRelease,
} from '../../../releases/__fixtures__/release.fixture'
import {createSchema} from '../../../schema/createSchema'
import {createMockDocumentInVariant} from '../../__fixtures__/createMockDocumentInVariant'
import {variantAlphaAudience} from '../../__fixtures__/variants.fixture'
import {getVariantDocumentDuplicationPlan} from '../getVariantDocumentDuplicationPlan'

const schema = createSchema({
  name: 'default',
  types: [
    defineType({
      name: 'article',
      type: 'document',
      fields: [defineField({name: 'title', type: 'string'})],
    }),
    defineType({
      name: 'liveArticle',
      type: 'document',
      liveEdit: true,
      fields: [defineField({name: 'title', type: 'string'})],
    }),
  ],
})

const releasesById = new Map<string, ReleaseDocument>(
  [activeASAPRelease, scheduledRelease, activeCardinalityOneRelease].map((release) => [
    release._id,
    release,
  ]),
)

function version(options: {
  documentId: string
  groupId: string
  bundleId?: string
  documentType?: string
  goingToUnpublish?: boolean
}) {
  return createMockDocumentInVariant({...options, variantId: variantAlphaAudience._id})
}

function plan(documents: ReturnType<typeof version>[]) {
  return getVariantDocumentDuplicationPlan({documents, releasesById, schema})
}

describe('getVariantDocumentDuplicationPlan', () => {
  it('copies draft versions as drafts', () => {
    expect(
      plan([
        version({documentId: 'drafts.scope.article-1', groupId: 'article-1', bundleId: 'drafts'}),
      ]),
    ).toEqual({
      toCreate: [
        {documentGroupId: 'article-1', baseId: 'drafts.scope.article-1', perspective: 'drafts'},
      ],
      skipped: [],
    })
  })

  it('copies published versions as drafts', () => {
    expect(plan([version({documentId: 'versions.scope.article-1', groupId: 'article-1'})])).toEqual(
      {
        toCreate: [
          {documentGroupId: 'article-1', baseId: 'versions.scope.article-1', perspective: 'drafts'},
        ],
        skipped: [],
      },
    )
  })

  it('only copies the draft of a document that has both a published and a draft version', () => {
    const result = plan([
      version({documentId: 'versions.scope.article-1', groupId: 'article-1'}),
      version({documentId: 'drafts.scope.article-1', groupId: 'article-1', bundleId: 'drafts'}),
      version({documentId: 'versions.scope.article-2', groupId: 'article-2'}),
    ])

    expect(result.toCreate).toEqual([
      {documentGroupId: 'article-1', baseId: 'drafts.scope.article-1', perspective: 'drafts'},
      {documentGroupId: 'article-2', baseId: 'versions.scope.article-2', perspective: 'drafts'},
    ])
  })

  it('copies published versions of live-edit types as published', () => {
    expect(
      plan([
        version({
          documentId: 'versions.scope.live-1',
          groupId: 'live-1',
          documentType: 'liveArticle',
        }),
      ]).toCreate,
    ).toEqual([
      {documentGroupId: 'live-1', baseId: 'versions.scope.live-1', perspective: 'published'},
    ])
  })

  it('copies release versions into the same release', () => {
    const result = plan([
      version({
        documentId: 'versions.rASAP.scope.article-1',
        groupId: 'article-1',
        bundleId: 'rASAP',
      }),
    ])

    expect(result).toEqual({
      toCreate: [
        {
          documentGroupId: 'article-1',
          baseId: 'versions.rASAP.scope.article-1',
          perspective: 'rASAP',
        },
      ],
      skipped: [],
    })
  })

  it('copies release versions alongside the draft and published versions of the same document', () => {
    const result = plan([
      version({documentId: 'versions.scope.article-1', groupId: 'article-1'}),
      version({documentId: 'drafts.scope.article-1', groupId: 'article-1', bundleId: 'drafts'}),
      version({
        documentId: 'versions.rASAP.scope.article-1',
        groupId: 'article-1',
        bundleId: 'rASAP',
      }),
    ])

    expect(result.toCreate.map((item) => item.perspective)).toEqual(['drafts', 'rASAP'])
  })

  it('skips versions in a scheduled release', () => {
    const scheduledVersion = version({
      documentId: 'versions.rScheduled.scope.article-1',
      groupId: 'article-1',
      bundleId: 'rScheduled',
    })

    expect(plan([scheduledVersion])).toEqual({
      toCreate: [],
      skipped: [
        {document: scheduledVersion, reason: 'scheduled-release', release: scheduledRelease},
      ],
    })
  })

  it('skips versions in a scheduled draft, which holds a single document', () => {
    const scheduledDraft = version({
      documentId: 'versions.rCardinalityOne.scope.article-1',
      groupId: 'article-1',
      bundleId: 'rCardinalityOne',
    })

    expect(plan([scheduledDraft]).skipped).toEqual([
      {document: scheduledDraft, reason: 'scheduled-release', release: activeCardinalityOneRelease},
    ])
  })

  it('skips release versions that are marked to be unpublished', () => {
    const unpublishing = version({
      documentId: 'versions.rASAP.scope.article-1',
      groupId: 'article-1',
      bundleId: 'rASAP',
      goingToUnpublish: true,
    })

    expect(plan([unpublishing])).toEqual({
      toCreate: [],
      skipped: [{document: unpublishing, reason: 'going-to-unpublish', release: activeASAPRelease}],
    })
  })

  it('returns an empty plan for a variant without documents', () => {
    expect(plan([])).toEqual({toCreate: [], skipped: []})
  })
})
