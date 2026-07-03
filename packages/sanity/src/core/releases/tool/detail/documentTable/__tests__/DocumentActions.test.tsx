import {defineType} from '@sanity/types'
import {render, screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {
  mockUseDocumentPairPermissions,
  useDocumentPairPermissionsMockReturn,
} from '../../../../../../../test/mocks/useDocumentPairPermissions.mock'
import {findByDataUi} from '../../../../../../../test/setup/customQueries'
import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {defineConfig} from '../../../../../config'
import {type DocumentPermission} from '../../../../../store/grants/documentPairPermissions'
import {releasesUsEnglishLocaleBundle} from '../../../../i18n'
import {documentsInRelease} from '../../__tests__/__mocks__/useBundleDocuments.mock'
import {DocumentActions} from '../DocumentActions'

vi.mock('../../../../../store/grants/documentPairPermissions', () => ({
  useDocumentPairPermissions: vi.fn(() => useDocumentPairPermissionsMockReturn),
}))

vi.mock('../../../../components/dialog/DeleteDocumentDialog', () => ({
  DeleteDocumentDialog: () => <div data-testid="delete-document-dialog" />,
}))

const config = defineConfig({
  projectId: 'test',
  dataset: 'test',
  schema: {
    types: [
      defineType({
        name: 'testDoc',
        type: 'document',
        fields: [{name: 'title', type: 'string'}],
      }),
    ],
  },
})

const documentWithVersionId = {
  ...documentsInRelease,
  document: {
    ...documentsInRelease.document,
    _id: 'versions.rActive.doc1',
    _type: 'testDoc',
  },
}

async function renderActions() {
  const wrapper = await createTestProvider({
    config,
    resources: [releasesUsEnglishLocaleBundle],
  })
  render(<DocumentActions document={documentWithVersionId} releaseTitle="Active release" />, {
    wrapper,
  })
  await userEvent.click(await findByDataUi(document.body, 'MenuButton'))
  await screen.findByText('Delete document')
}

describe('DocumentActions', () => {
  beforeEach(() => {
    mockUseDocumentPairPermissions.mockImplementation(() => useDocumentPairPermissionsMockReturn)
  })

  it('renders discard, delete and unpublish actions in the context menu', async () => {
    await renderActions()

    expect(screen.getByText('Discard version')).toBeInTheDocument()
    expect(screen.getByText('Delete document')).toBeInTheDocument()
    expect(screen.getByText('When releasing')).toBeInTheDocument()
    expect(screen.getByText('Unpublish')).toBeInTheDocument()
  })

  it('opens the delete document dialog when clicking delete document', async () => {
    await renderActions()

    await userEvent.click(screen.getByText('Delete document'))

    await waitFor(() => {
      expect(screen.getByTestId('delete-document-dialog')).toBeInTheDocument()
    })
  })

  it('disables the delete document action without delete permission', async () => {
    mockUseDocumentPairPermissions.mockImplementation(
      ({permission}: {permission: DocumentPermission}) =>
        permission === 'delete'
          ? [{granted: false, reason: ''}, false]
          : useDocumentPairPermissionsMockReturn,
    )

    await renderActions()

    const deleteMenuItem = screen.getByText('Delete document').closest('[data-ui="MenuItem"]')
    expect(deleteMenuItem).toHaveAttribute('data-disabled')
  })
})
