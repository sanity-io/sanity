import {render, screen} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {
  mockUseDocumentPairPermissions,
  useDocumentPairPermissionsMockReturn,
} from '../../../../../../../test/mocks/useDocumentPairPermissions.mock'
import {flushMicrotasksThisIsACodeSmell} from '../../../../../../../test/testUtils/flushMicrotasks'
import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {type DocumentActionsResolver} from '../../../../../config/types'
import {studioDefaultLocaleResources} from '../../../../../i18n/bundles/studio'
import {mockUseDocumentVersions} from '../../../../hooks/__tests__/__mocks__/useDocumentVersions.mock'
import {releasesUsEnglishLocaleBundle} from '../../../../i18n'
import {type VersionInfoDocumentStub} from '../../../../store/types'
import {type BundleDocumentRow} from '../../ReleaseSummary'
import {DocumentActions} from '../DocumentActions'

vi.mock('../../../../../store/grants/documentPairPermissions', () => ({
  useDocumentPairPermissions: vi.fn(() => useDocumentPairPermissionsMockReturn),
}))

vi.mock('../../../../hooks/useDocumentVersions', () => ({
  useDocumentVersions: vi.fn(),
}))

const VARIANT_ID = 'variant-nordic'

const documentRow = {
  memoKey: 'memo-1',
  validation: {validation: [], hasError: false, isValidating: false},
  document: {
    _id: 'versions.release1.doc1',
    _type: 'author',
    _rev: 'rev1',
    _createdAt: '',
    _updatedAt: '',
    publishedDocumentExists: true,
  },
} as unknown as BundleDocumentRow

// A variant release version: its id carries an opaque scope hash and `_system.variant` names the
// variant the row belongs to. `publishedDocumentExists` addresses the base published document, so
// it is deliberately set against the variant's own publish state in these fixtures.
const variantDocumentRow = {
  ...documentRow,
  document: {
    ...documentRow.document,
    _id: 'versions.k7fh2qzs9m.doc1',
    publishedDocumentExists: false,
    _system: {
      bundleId: 'release1',
      scopeId: 'k7fh2qzs9m',
      variant: {_ref: VARIANT_ID, _weak: true},
      group: {_ref: 'doc1', _weak: true},
    },
  },
} as unknown as BundleDocumentRow

const variantPublishedSibling = {
  _id: 'versions.p3n8xw2.doc1',
  _rev: 'rev1',
  _type: 'author',
  _createdAt: '',
  _updatedAt: '',
  _system: {
    scopeId: 'p3n8xw2',
    variant: {_ref: VARIANT_ID, _weak: true},
    group: {_ref: 'doc1', _weak: true},
  },
} as VersionInfoDocumentStub

const baseReleaseVersion = {
  ...variantPublishedSibling,
  _id: 'versions.release1.doc1',
  _system: {bundleId: 'release1', scopeId: 'release1', group: {_ref: 'doc1', _weak: true}},
} as VersionInfoDocumentStub

const setDocumentVersions = (versions: VersionInfoDocumentStub[], loading = false) =>
  mockUseDocumentVersions.mockReturnValue({
    data: versions.map(({_id}) => _id),
    versions,
    error: null,
    loading,
  })

const localeResources = [studioDefaultLocaleResources, releasesUsEnglishLocaleBundle]

const renderDocumentActions = async ({
  document = documentRow,
  documentActions,
  versionType = 'version',
}: {
  document?: BundleDocumentRow
  documentActions?: DocumentActionsResolver
  versionType?: 'version' | 'scheduled-draft'
} = {}) => {
  const wrapper = await createTestProvider({
    resources: localeResources,
    config: documentActions ? {document: {actions: documentActions}} : undefined,
  })

  render(
    <DocumentActions
      document={document}
      releaseId="release1"
      releaseTitle="Release 1"
      versionType={versionType}
    />,
    {wrapper},
  )
  await flushMicrotasksThisIsACodeSmell()
}

const getUnpublishMenuItem = () => screen.getByRole('menuitem', {name: /Unpublish/, hidden: true})

const getDiscardMenuItem = () =>
  screen.getByRole('menuitem', {name: /Discard version/, hidden: true})

describe('DocumentActions', () => {
  beforeEach(() => {
    mockUseDocumentPairPermissions.mockReturnValue(useDocumentPairPermissionsMockReturn)
    mockUseDocumentVersions.mockClear()
    setDocumentVersions([baseReleaseVersion, variantPublishedSibling])
  })

  it('renders discard version and unpublish when document.actions is unfiltered', async () => {
    await renderDocumentActions()

    expect(screen.getByText('Discard version')).toBeInTheDocument()
    expect(screen.getByText('Unpublish')).toBeInTheDocument()
  })

  it('hides discard version and unpublish when both action ids are omitted', async () => {
    await renderDocumentActions({
      documentActions: (prev) => prev.filter((action) => action.action === 'publish'),
    })

    expect(screen.queryByText('Discard version')).not.toBeInTheDocument()
    expect(screen.queryByText('Unpublish')).not.toBeInTheDocument()
  })

  // A cardinality-one release row is a scheduled draft, and that plugin's action list has no
  // `unpublishVersion`, so the row must not offer Unpublish where the footer cannot.
  it('drops unpublish on a scheduled draft row', async () => {
    await renderDocumentActions({versionType: 'scheduled-draft'})

    expect(screen.getByText('Discard version')).toBeInTheDocument()
    expect(screen.queryByText('Unpublish')).not.toBeInTheDocument()
  })

  it('keeps unpublish when only discardVersion is omitted', async () => {
    await renderDocumentActions({
      documentActions: (prev) => prev.filter((action) => action.action !== 'discardVersion'),
    })

    expect(screen.queryByText('Discard version')).not.toBeInTheDocument()
    expect(screen.getByText('Unpublish')).toBeInTheDocument()
  })

  // A variant row's id carries a scope hash, not the release id the document footer resolves against.
  it('resolves row actions for the release id on a variant row', async () => {
    const documentActions = vi.fn<DocumentActionsResolver>((prev) => prev)
    await renderDocumentActions({document: variantDocumentRow, documentActions})

    expect(documentActions).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({releaseId: 'release1'}),
    )
  })

  describe('unpublish publish-state gating', () => {
    it('enables unpublish for a non-variant row with a published document', async () => {
      await renderDocumentActions()

      expect(getUnpublishMenuItem()).toBeEnabled()
    })

    it('disables unpublish for a non-variant row with no published document', async () => {
      await renderDocumentActions({
        document: {
          ...documentRow,
          document: {...documentRow.document, publishedDocumentExists: false},
        } as unknown as BundleDocumentRow,
      })

      expect(getUnpublishMenuItem()).toBeDisabled()
      expect(
        screen.getByText('There is no published version of this document.'),
      ).toBeInTheDocument()
    })

    // The base published document is irrelevant to a variant: only the variant-of-published
    // sibling says whether unpublishing has anything to remove.
    it('enables unpublish for a variant row whose variant is published', async () => {
      setDocumentVersions([baseReleaseVersion, variantPublishedSibling])
      await renderDocumentActions({document: variantDocumentRow})

      expect(getUnpublishMenuItem()).toBeEnabled()
    })

    it('disables unpublish for a variant row with no published sibling, even when the base document is published', async () => {
      setDocumentVersions([baseReleaseVersion])
      await renderDocumentActions({
        document: {
          ...variantDocumentRow,
          document: {...variantDocumentRow.document, publishedDocumentExists: true},
        } as unknown as BundleDocumentRow,
      })

      expect(getUnpublishMenuItem()).toBeDisabled()
      expect(
        screen.getByText('There is no published version of this document.'),
      ).toBeInTheDocument()
    })

    it('disables unpublish while the variant publish state resolves', async () => {
      setDocumentVersions([], true)
      await renderDocumentActions({document: variantDocumentRow})

      expect(getUnpublishMenuItem()).toBeDisabled()
      expect(
        screen.queryByText('There is no published version of this document.'),
      ).not.toBeInTheDocument()
    })

    it('disables unpublish for a document already marked for unpublishing', async () => {
      await renderDocumentActions({
        document: {
          ...documentRow,
          document: {...documentRow.document, _system: {delete: true}},
        } as unknown as BundleDocumentRow,
      })

      expect(getUnpublishMenuItem()).toBeDisabled()
      expect(screen.getByText('This document is already unpublished.')).toBeInTheDocument()
    })

    it('leaves the variant lookup alone for a non-variant row', async () => {
      await renderDocumentActions()

      expect(mockUseDocumentVersions).not.toHaveBeenCalled()
    })
  })

  describe('insufficient permissions', () => {
    beforeEach(() => {
      mockUseDocumentPairPermissions.mockReturnValue([{granted: false, reason: 'nope'}, false])
    })

    it('explains a denied discard version with the roles message', async () => {
      await renderDocumentActions()

      expect(getDiscardMenuItem()).toBeDisabled()
      expect(
        screen.getByText('You do not have permission to discard changes in this document.'),
      ).toBeInTheDocument()
    })

    it('explains a denied unpublish with the roles message', async () => {
      await renderDocumentActions()

      expect(getUnpublishMenuItem()).toBeDisabled()
      expect(
        screen.getByText('You do not have permission to unpublish this document.'),
      ).toBeInTheDocument()
      expect(screen.getAllByText('Administrator').length).toBeGreaterThan(0)
    })

    it('shows no permissions message while the permission check is still loading', async () => {
      mockUseDocumentPairPermissions.mockReturnValue([undefined, true])
      await renderDocumentActions()

      expect(getUnpublishMenuItem()).toBeDisabled()
      expect(screen.queryByText('Insufficient permissions')).not.toBeInTheDocument()
    })
  })
})
