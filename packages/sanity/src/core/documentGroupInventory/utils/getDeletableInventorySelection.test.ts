import {type DocumentSystem} from '@sanity/types'
import {describe, expect, it, vi} from 'vitest'

import {getMockSource} from '../../../../test/testUtils/getMockWorkspaceFromConfig'
import {type DocumentActionComponent} from '../../config/document/actions'
import {
  activeCardinalityOneRelease,
  activeScheduledRelease,
} from '../../releases/__fixtures__/release.fixture'
import {type VersionInfoDocumentStub} from '../../releases/store/types'
import {getReleaseDocumentIdFromReleaseId} from '../../releases/util/getReleaseDocumentIdFromReleaseId'
import {type Variant} from '../machines/selectionMachine'
import {getDeletableInventorySelection} from './getDeletableInventorySelection'

const PUBLISHED_ID = 'article'

const deleteAction: DocumentActionComponent = Object.assign(() => null, {action: 'delete' as const})

function stub(id: string, system: Partial<DocumentSystem> = {}): VersionInfoDocumentStub {
  return {
    _id: id,
    _rev: 'rev',
    _createdAt: '2026-01-01T00:00:00.000Z',
    _updatedAt: '2026-01-01T00:00:00.000Z',
    _type: 'article',
    _system: {
      group: {_ref: PUBLISHED_ID, _weak: true},
      ...system,
    },
  }
}

function draftDocument(): VersionInfoDocumentStub {
  return stub(`drafts.${PUBLISHED_ID}`, {bundleId: 'drafts'})
}

function publishedDocument(): VersionInfoDocumentStub {
  return stub(PUBLISHED_ID)
}

function releaseDocument(releaseId: string): VersionInfoDocumentStub {
  return stub(`versions.${releaseId}.${PUBLISHED_ID}`, {
    bundleId: releaseId,
    release: {_ref: getReleaseDocumentIdFromReleaseId(releaseId), _weak: true},
  })
}

function asVariant(document: VersionInfoDocumentStub): Variant {
  return {id: document._id, name: document._id, document}
}

const draftVariant = asVariant(draftDocument())
const publishedVariant = asVariant(publishedDocument())
const versionVariant = asVariant(releaseDocument('rActive'))
const scheduledDraftVariant = asVariant(releaseDocument('rCardinalityOne'))

const releases = new Map([
  [activeScheduledRelease._id, activeScheduledRelease],
  [activeCardinalityOneRelease._id, activeCardinalityOneRelease],
])

describe('getDeletableInventorySelection', () => {
  it('includes every selected row and shows delete when delete is configured for all types', async () => {
    const source = await getMockSource({
      config: {
        document: {
          actions: (prev) => [...prev, deleteAction],
        },
      },
    })

    const result = getDeletableInventorySelection({
      selectedIds: new Set([draftVariant.id, publishedVariant.id, versionVariant.id]),
      variants: [draftVariant, publishedVariant, versionVariant],
      releases,
      schemaType: 'article',
      resolveActions: source.document.actions,
    })

    expect(result.shouldShowDelete).toBe(true)
    expect(result.deletableIds).toEqual([draftVariant.id, publishedVariant.id, versionVariant.id])
  })

  it('hides delete when delete is injected and then stripped for every type', async () => {
    const source = await getMockSource({
      config: {
        document: {
          actions: (prev) => [...prev, deleteAction].filter((action) => action.action !== 'delete'),
        },
      },
    })

    const result = getDeletableInventorySelection({
      selectedIds: new Set([draftVariant.id, publishedVariant.id, versionVariant.id]),
      variants: [draftVariant, publishedVariant, versionVariant],
      releases,
      schemaType: 'article',
      resolveActions: source.document.actions,
    })

    expect(result.shouldShowDelete).toBe(false)
    expect(result.deletableIds).toEqual([])
  })

  it('shows delete for a mixed selection and keeps only draft and published rows', async () => {
    const source = await getMockSource({
      config: {
        document: {
          actions: (prev, context) =>
            context.versionType === 'draft' || context.versionType === 'published'
              ? [...prev, deleteAction]
              : prev,
        },
      },
    })

    const result = getDeletableInventorySelection({
      selectedIds: new Set([
        draftVariant.id,
        versionVariant.id,
        scheduledDraftVariant.id,
        publishedVariant.id,
      ]),
      variants: [draftVariant, versionVariant, scheduledDraftVariant, publishedVariant],
      releases,
      schemaType: 'article',
      resolveActions: source.document.actions,
    })

    expect(result.shouldShowDelete).toBe(true)
    expect(result.deletableIds).toEqual([draftVariant.id, publishedVariant.id])
  })

  it('hides delete when only version and scheduled-draft rows are selected and they lack delete', async () => {
    const source = await getMockSource({
      config: {
        document: {
          actions: (prev, context) =>
            context.versionType === 'draft' ? [...prev, deleteAction] : prev,
        },
      },
    })

    const result = getDeletableInventorySelection({
      selectedIds: new Set([versionVariant.id, scheduledDraftVariant.id]),
      variants: [versionVariant, scheduledDraftVariant],
      releases,
      schemaType: 'article',
      resolveActions: source.document.actions,
    })

    expect(result.shouldShowDelete).toBe(false)
    expect(result.deletableIds).toEqual([])
  })

  it('does not resolve actions when schemaType is missing', async () => {
    const resolveActions = vi.fn()

    const result = getDeletableInventorySelection({
      selectedIds: new Set([draftVariant.id]),
      variants: [draftVariant],
      releases,
      schemaType: undefined,
      resolveActions,
    })

    expect(result).toEqual({deletableIds: [], shouldShowDelete: false})
    expect(resolveActions).not.toHaveBeenCalled()
  })

  it('hides delete when nothing is selected', async () => {
    const source = await getMockSource({
      config: {
        document: {
          actions: (prev) => [...prev, deleteAction],
        },
      },
    })

    const result = getDeletableInventorySelection({
      selectedIds: new Set(),
      variants: [draftVariant],
      releases,
      schemaType: 'article',
      resolveActions: source.document.actions,
    })

    expect(result).toEqual({deletableIds: [], shouldShowDelete: false})
  })

  it('fails the hide assertion when the all-denied resolver is forced to include delete', async () => {
    const deniedSource = await getMockSource({
      config: {
        document: {
          actions: (prev) => [...prev, deleteAction].filter((action) => action.action !== 'delete'),
        },
      },
    })
    const denied = getDeletableInventorySelection({
      selectedIds: new Set([versionVariant.id]),
      variants: [versionVariant],
      releases,
      schemaType: 'article',
      resolveActions: deniedSource.document.actions,
    })
    expect(denied.shouldShowDelete).toBe(false)

    const forcedOpen = getDeletableInventorySelection({
      selectedIds: new Set([versionVariant.id]),
      variants: [versionVariant],
      releases,
      schemaType: 'article',
      resolveActions: () => [deleteAction],
    })
    expect(forcedOpen.shouldShowDelete).toBe(true)
    expect(forcedOpen.deletableIds).toEqual([versionVariant.id])
  })

  it('fails the exclude assertion when the mixed-selection resolver is forced to include delete', async () => {
    const mixedSource = await getMockSource({
      config: {
        document: {
          actions: (prev, context) =>
            context.versionType === 'draft' ? [...prev, deleteAction] : prev,
        },
      },
    })
    const mixed = getDeletableInventorySelection({
      selectedIds: new Set([draftVariant.id, versionVariant.id]),
      variants: [draftVariant, versionVariant],
      releases,
      schemaType: 'article',
      resolveActions: mixedSource.document.actions,
    })
    expect(mixed.deletableIds).toEqual([draftVariant.id])

    const forcedOpen = getDeletableInventorySelection({
      selectedIds: new Set([draftVariant.id, versionVariant.id]),
      variants: [draftVariant, versionVariant],
      releases,
      schemaType: 'article',
      resolveActions: () => [deleteAction],
    })
    expect(forcedOpen.deletableIds).toEqual([draftVariant.id, versionVariant.id])
  })
})
