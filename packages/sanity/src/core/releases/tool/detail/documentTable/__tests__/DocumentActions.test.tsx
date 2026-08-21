import {render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {useDocumentPairPermissionsMockReturn} from '../../../../../../../test/mocks/useDocumentPairPermissions.mock'
import {flushMicrotasksThisIsACodeSmell} from '../../../../../../../test/testUtils/flushMicrotasks'
import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
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

    render(<DocumentActions document={documentRow} releaseTitle="Release 1" />, {wrapper})
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

    render(<DocumentActions document={documentRow} releaseTitle="Release 1" />, {wrapper})
    await flushMicrotasksThisIsACodeSmell()

    expect(screen.queryByText('Discard version')).not.toBeInTheDocument()
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

    render(<DocumentActions document={documentRow} releaseTitle="Release 1" />, {wrapper})
    await flushMicrotasksThisIsACodeSmell()

    expect(screen.queryByText('Discard version')).not.toBeInTheDocument()
    expect(screen.getByText('Unpublish')).toBeInTheDocument()
  })
})
