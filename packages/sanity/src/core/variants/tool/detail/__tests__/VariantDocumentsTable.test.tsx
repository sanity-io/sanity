import {type SanityDocument} from '@sanity/client'
import {render, screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {describe, expect, it, vi} from 'vitest'

import {setupVirtualListEnv} from '../../../../../../test/testUtils/setupVirtualListEnv'
import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {variantsUsEnglishLocaleBundle} from '../../../i18n'
import {VariantDocumentsTable} from '../VariantDocumentsTable'

vi.mock('../../../../preview/components/SanityDefaultPreview', () => ({
  SanityDefaultPreview: vi.fn(({isPlaceholder, title, subtitle}) => (
    <div data-testid={isPlaceholder ? 'preview-placeholder' : 'preview'}>
      {!isPlaceholder && title && <div>{title}</div>}
      {!isPlaceholder && subtitle && <div>{subtitle}</div>}
    </div>
  )),
}))

setupVirtualListEnv()

const mockDocuments: SanityDocument[] = [
  {
    _id: 'drafts.article-first',
    _type: 'article',
    _rev: 'rev-1',
    _createdAt: '2025-01-01T00:00:00Z',
    _updatedAt: '2025-06-01T00:00:00Z',
    title: 'First article',
  },
  {
    _id: 'drafts.article-second',
    _type: 'article',
    _rev: 'rev-2',
    _createdAt: '2025-01-02T00:00:00Z',
    _updatedAt: '2025-06-02T00:00:00Z',
    title: 'Second article',
  },
]

describe('VariantDocumentsTable', () => {
  const renderTable = async (documents: SanityDocument[] = mockDocuments) => {
    const wrapper = await createTestProvider({
      resources: [variantsUsEnglishLocaleBundle],
    })
    const result = render(<VariantDocumentsTable documents={documents} />, {wrapper})
    await screen.findByPlaceholderText('Search documents')
    return result
  }

  it('shows an empty state when there are no documents', async () => {
    await renderTable([])

    expect(screen.getByText('No documents in this variant')).toBeInTheDocument()
  })

  it('renders document rows with title, type, and edited columns', async () => {
    await renderTable()

    await waitFor(() => {
      expect(screen.getAllByTestId('table-row')).toHaveLength(2)
    })

    expect(screen.getByText('First article')).toBeInTheDocument()
    expect(screen.getByText('Second article')).toBeInTheDocument()
    expect(screen.getByText('drafts.article-first')).toBeInTheDocument()
    expect(screen.getAllByText('article')).toHaveLength(2)
  })

  it('filters documents when searching by title, id, or type', async () => {
    const user = userEvent.setup()

    await renderTable()

    await waitFor(() => {
      expect(screen.getAllByTestId('table-row')).toHaveLength(2)
    })

    await user.type(screen.getByPlaceholderText('Search documents'), 'Second')

    await waitFor(() => {
      expect(screen.getAllByTestId('table-row')).toHaveLength(1)
    })

    expect(screen.getByText('Second article')).toBeInTheDocument()
    expect(screen.queryByText('First article')).not.toBeInTheDocument()
  })
})
