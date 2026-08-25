import {render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {useDocumentPairPermissionsMockReturn} from '../../../../../../../test/mocks/useDocumentPairPermissions.mock'
import {flushMicrotasksThisIsACodeSmell} from '../../../../../../../test/testUtils/flushMicrotasks'
import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {type DocumentActionsResolver} from '../../../../../config/types'
import {studioDefaultLocaleResources} from '../../../../../i18n/bundles/studio'
import {releasesUsEnglishLocaleBundle} from '../../../../i18n'
import {type BundleDocumentRow} from '../../ReleaseSummary'
import {DocumentActions} from '../DocumentActions'

vi.mock('../../../../../store/grants/documentPairPermissions', () => ({
  useDocumentPairPermissions: vi.fn(() => useDocumentPairPermissionsMockReturn),
}))

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

const localeResources = [studioDefaultLocaleResources, releasesUsEnglishLocaleBundle]

describe('DocumentActions', () => {
  it('renders discard version and unpublish when document.actions is unfiltered', async () => {
    const wrapper = await createTestProvider({resources: localeResources})

    render(
      <DocumentActions
        document={documentRow}
        releaseId="release1"
        releaseTitle="Release 1"
        versionType="version"
      />,
      {wrapper},
    )
    await flushMicrotasksThisIsACodeSmell()

    expect(screen.getByText('Discard version')).toBeInTheDocument()
    expect(screen.getByText('Unpublish')).toBeInTheDocument()
  })

  it('hides discard version and unpublish when both action ids are omitted', async () => {
    const wrapper = await createTestProvider({
      resources: localeResources,
      config: {
        document: {
          actions: (prev) => prev.filter((action) => action.action === 'publish'),
        },
      },
    })

    render(
      <DocumentActions
        document={documentRow}
        releaseId="release1"
        releaseTitle="Release 1"
        versionType="version"
      />,
      {wrapper},
    )
    await flushMicrotasksThisIsACodeSmell()

    expect(screen.queryByText('Discard version')).not.toBeInTheDocument()
    expect(screen.queryByText('Unpublish')).not.toBeInTheDocument()
  })

  // A cardinality-one release row is a scheduled draft, and that plugin's action list has no
  // `unpublishVersion`, so the row must not offer Unpublish where the footer cannot.
  it('drops unpublish on a scheduled draft row', async () => {
    const wrapper = await createTestProvider({resources: localeResources})

    render(
      <DocumentActions
        document={documentRow}
        releaseId="release1"
        releaseTitle="Release 1"
        versionType="scheduled-draft"
      />,
      {wrapper},
    )
    await flushMicrotasksThisIsACodeSmell()

    expect(screen.getByText('Discard version')).toBeInTheDocument()
    expect(screen.queryByText('Unpublish')).not.toBeInTheDocument()
  })

  it('keeps unpublish when only discardVersion is omitted', async () => {
    const wrapper = await createTestProvider({
      resources: localeResources,
      config: {
        document: {
          actions: (prev) => prev.filter((action) => action.action !== 'discardVersion'),
        },
      },
    })

    render(
      <DocumentActions
        document={documentRow}
        releaseId="release1"
        releaseTitle="Release 1"
        versionType="version"
      />,
      {wrapper},
    )
    await flushMicrotasksThisIsACodeSmell()

    expect(screen.queryByText('Discard version')).not.toBeInTheDocument()
    expect(screen.getByText('Unpublish')).toBeInTheDocument()
  })

  // A variant row's id carries a scope hash, not the release id the document footer resolves against.
  it('resolves row actions for the release id on a variant row', async () => {
    const documentActions = vi.fn<DocumentActionsResolver>((prev) => prev)
    const wrapper = await createTestProvider({
      resources: localeResources,
      config: {document: {actions: documentActions}},
    })

    const variantDocumentRow = {
      ...documentRow,
      document: {...documentRow.document, _id: 'versions.k7fh2qzs9m.doc1'},
    } as unknown as BundleDocumentRow

    render(
      <DocumentActions
        document={variantDocumentRow}
        releaseId="release1"
        releaseTitle="Release 1"
        versionType="version"
      />,
      {wrapper},
    )
    await flushMicrotasksThisIsACodeSmell()

    expect(documentActions).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({releaseId: 'release1'}),
    )
  })
})
