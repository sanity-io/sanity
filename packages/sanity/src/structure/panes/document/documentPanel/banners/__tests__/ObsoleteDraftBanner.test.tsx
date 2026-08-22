import {type ObjectSchemaType} from '@sanity/types'
import {render, screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {
  type DocumentActionComponent,
  type DocumentActionsResolver,
  useDocumentOperation,
} from 'sanity'
import {beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {structureUsEnglishLocaleBundle} from '../../../../../i18n'
import {ObsoleteDraftBanner} from '../ObsoleteDraftBanner'

vi.mock('sanity', async () => {
  const sanity = await vi.importActual('sanity')
  return {
    ...sanity,
    useDocumentOperation: vi.fn(),
  }
})

const mockUseDocumentOperation = useDocumentOperation as Mock<typeof useDocumentOperation>
const publishExecute = vi.fn()
const discardChangesExecute = vi.fn()

const discardChangesAction: DocumentActionComponent = Object.assign(() => null, {
  action: 'discardChanges' as const,
})

const authorSchemaType = {
  name: 'author',
  title: 'Author',
  jsonType: 'object',
} as ObjectSchemaType

const renderBanner = async (documentActions?: DocumentActionsResolver) => {
  const wrapper = await createTestProvider({
    resources: [structureUsEnglishLocaleBundle],
    config: documentActions ? {document: {actions: documentActions}} : undefined,
  })

  return render(
    <ObsoleteDraftBanner
      displayed={{_id: 'drafts.doc1', _type: 'author'}}
      documentId="doc1"
      schemaType={authorSchemaType}
      i18nKey="banners.live-edit-draft-banner.text"
    />,
    {wrapper},
  )
}

describe('ObsoleteDraftBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseDocumentOperation.mockReturnValue({
      publish: {execute: publishExecute},
      discardChanges: {execute: discardChangesExecute},
    } as unknown as ReturnType<typeof useDocumentOperation>)
  })

  it('hides discard when discardChanges is not configured', async () => {
    await renderBanner()

    await waitFor(() => {
      expect(screen.getByTestId('live-edit-type-banner')).toBeInTheDocument()
    })
    expect(screen.getByRole('button', {name: 'Publish draft'})).toBeInTheDocument()
    expect(screen.getByRole('button', {name: 'Compare draft'})).toBeInTheDocument()
    expect(screen.queryByRole('button', {name: 'Discard draft'})).not.toBeInTheDocument()
  })

  it('shows discard when a discardChanges stub is injected', async () => {
    await renderBanner((prev) => [...prev, discardChangesAction])

    await waitFor(() => {
      expect(screen.getByRole('button', {name: 'Discard draft'})).toBeInTheDocument()
    })
  })

  it('hides discard when discardChanges is only configured for published', async () => {
    await renderBanner((prev, ctx) =>
      ctx.versionType === 'published' ? [...prev, discardChangesAction] : prev,
    )

    await waitFor(() => {
      expect(screen.getByTestId('live-edit-type-banner')).toBeInTheDocument()
    })
    expect(screen.queryByRole('button', {name: 'Discard draft'})).not.toBeInTheDocument()
  })

  it('keeps publish when document.actions is empty', async () => {
    await renderBanner(() => [])

    await waitFor(() => {
      expect(screen.getByRole('button', {name: 'Publish draft'})).toBeInTheDocument()
    })
    expect(screen.queryByRole('button', {name: 'Discard draft'})).not.toBeInTheDocument()
  })

  it('executes discard when the configured button is clicked', async () => {
    await renderBanner((prev) => [...prev, discardChangesAction])

    await waitFor(() => {
      expect(screen.getByRole('button', {name: 'Discard draft'})).toBeInTheDocument()
    })
    await userEvent.click(screen.getByRole('button', {name: 'Discard draft'}))

    expect(discardChangesExecute).toHaveBeenCalledTimes(1)
  })
})
