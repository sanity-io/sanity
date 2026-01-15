import {type SanityDocument} from '@sanity/client'
import {render, screen, waitFor} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {structureUsEnglishLocaleBundle} from '../../../../../i18n'
import {ScheduledDraftOverrideBanner} from '../ScheduledDraftOverrideBanner'

vi.mock('sanity', async () => {
  const actual = await vi.importActual('sanity')
  return {
    ...actual,
    useScheduledDraftDocument: vi.fn(),
  }
})

const {useScheduledDraftDocument: mockUseScheduledDraftDocument} = vi.mocked(await import('sanity'))

describe('ScheduledDraftOverrideBanner', () => {
  const mockReleaseId = '_.releases.scheduled-draft-release'

  const createDraft = (id: string, rev: string): Partial<SanityDocument> => ({
    _id: `drafts.${id}`,
    _rev: rev,
  })

  const createScheduledDraft = (
    id: string,
    baseRev: string,
  ): Partial<SanityDocument> & {_system?: {base?: {rev?: string}}} => ({
    _id: `versions.release-id.${id}`,
    _system: {base: {rev: baseRev}},
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows banner when revisions differ', async () => {
    mockUseScheduledDraftDocument.mockReturnValue({
      firstDocument: createScheduledDraft('doc1', 'rev-base') as SanityDocument,
      firstDocumentPreview: undefined,
      firstDocumentValidation: undefined,
      documentsCount: 1,
      loading: false,
      error: null,
      previewLoading: false,
    })

    const wrapper = await createTestProvider({resources: [structureUsEnglishLocaleBundle]})

    render(
      <ScheduledDraftOverrideBanner
        releaseId={mockReleaseId}
        draftDocument={createDraft('doc1', 'rev-different')}
      />,
      {wrapper},
    )

    await waitFor(() => {
      expect(screen.getByText(/a scheduled draft for this document exists/i)).toBeInTheDocument()
    })
  })

  it('hides banner when revisions match', async () => {
    mockUseScheduledDraftDocument.mockReturnValue({
      firstDocument: createScheduledDraft('doc1', 'rev-same') as SanityDocument,
      firstDocumentPreview: undefined,
      firstDocumentValidation: undefined,
      documentsCount: 1,
      loading: false,
      error: null,
      previewLoading: false,
    })

    const wrapper = await createTestProvider({resources: [structureUsEnglishLocaleBundle]})

    render(
      <ScheduledDraftOverrideBanner
        releaseId={mockReleaseId}
        draftDocument={createDraft('doc1', 'rev-same')}
      />,
      {wrapper},
    )

    await waitFor(() => {
      expect(
        screen.queryByText(/a scheduled draft for this document exists/i),
      ).not.toBeInTheDocument()
    })
  })

  it('hides banner when documents do not match', async () => {
    mockUseScheduledDraftDocument.mockReturnValue({
      firstDocument: createScheduledDraft('doc2', 'rev-base') as SanityDocument,
      firstDocumentPreview: undefined,
      firstDocumentValidation: undefined,
      documentsCount: 1,
      loading: false,
      error: null,
      previewLoading: false,
    })

    const wrapper = await createTestProvider({resources: [structureUsEnglishLocaleBundle]})

    render(
      <ScheduledDraftOverrideBanner
        releaseId={mockReleaseId}
        draftDocument={createDraft('doc1', 'rev-base')}
      />,
      {wrapper},
    )

    await waitFor(() => {
      expect(
        screen.queryByText(/a scheduled draft for this document exists/i),
      ).not.toBeInTheDocument()
    })
  })
})
