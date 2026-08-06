import {render, screen, waitFor} from '@testing-library/react'
import {type ComponentProps} from 'react'
import {describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {useDocumentPreviewValues} from '../../../../tasks/hooks/useDocumentPreviewValues'
import {
  activeASAPRelease,
  activeScheduledRelease,
  archivedScheduledRelease,
  publishedASAPRelease,
} from '../../../__fixtures__/release.fixture'
import {releasesUsEnglishLocaleBundle} from '../../../i18n'
import {ReleaseDocumentPreview} from '../ReleaseDocumentPreview'

interface DocumentPresenceData {
  user: string
  sessionId: string
  lastActiveAt: string
}

const mockDocumentPresence: DocumentPresenceData[] = []

const mockPreviewValues = {
  title: 'Test Document',
  subtitle: 'Test Subtitle',
  media: null,
}

vi.mock('../../../../preview/components/SanityDefaultPreview', () => ({
  SanityDefaultPreview: vi.fn(({isPlaceholder, title, subtitle, status}) => (
    <div data-ui={isPlaceholder ? 'Placeholder' : 'Preview'}>
      {!isPlaceholder && title && <div>{title}</div>}
      {!isPlaceholder && subtitle && <div>{subtitle}</div>}
      {status}
    </div>
  )),
}))

vi.mock('../../../../tasks/hooks/useDocumentPreviewValues', () => ({
  useDocumentPreviewValues: vi.fn(() => ({
    isLoading: false,
    value: mockPreviewValues,
  })),
}))

vi.mock('sanity/router', () => ({
  useRouter: vi.fn(() => ({
    navigate: vi.fn(),
    state: {},
    resolveIntentLink: vi.fn(() => '#'),
    resolvePathFromState: vi.fn(),
  })),
  IntentLink: vi
    .fn()
    .mockImplementation(({children, searchParams}) => (
      <a data-search-params={JSON.stringify(searchParams)}>{children}</a>
    )),
  route: {
    create: vi.fn(() => ({
      path: vi.fn(),
    })),
  },
}))

vi.mock('../../../../store/presence/useDocumentPresence', () => ({
  useDocumentPresence: vi.fn(() => mockDocumentPresence),
}))

const renderTest = async (props: ComponentProps<typeof ReleaseDocumentPreview>) => {
  const wrapper = await createTestProvider({
    resources: [releasesUsEnglishLocaleBundle],
  })

  const rendered = render(<ReleaseDocumentPreview {...props} />, {wrapper})

  await waitFor(() => {
    expect(screen.queryByTestId('loading-block')).not.toBeInTheDocument()
  })

  return rendered
}

describe('ReleaseDocumentPreview', () => {
  it('renders with default props', async () => {
    await renderTest({
      documentId: 'doc123',
      documentTypeName: 'post',
      releaseId: activeASAPRelease._id,
    })

    expect(screen.getByText('Test Document')).toBeInTheDocument()
    expect(screen.getByText('Test Subtitle')).toBeInTheDocument()
  })

  it('renders in loading state', async () => {
    vi.mocked(useDocumentPreviewValues).mockReturnValueOnce({
      isLoading: true,
      value: null,
    })

    const {container} = await renderTest({
      documentId: 'doc123',
      documentTypeName: 'post',
      releaseId: activeASAPRelease._id,
    })

    expect(container.querySelector('[data-ui="Placeholder"]')).toBeInTheDocument()
  })

  it('creates link with published perspective when release state is published', async () => {
    const {container} = await renderTest({
      documentId: 'doc123',
      documentTypeName: 'post',
      releaseId: activeASAPRelease._id,
      releaseState: 'published',
    })

    const link = container.querySelector('a')
    // @ts-expect-error -- pre-existing, fix later
    const searchParams = JSON.parse(link.getAttribute('data-search-params'))
    expect(searchParams).toContainEqual(['perspective', 'published'])
  })

  it('creates link with release ID perspective when release state is not published', async () => {
    const {container} = await renderTest({
      documentId: 'doc123',
      documentTypeName: 'post',
      releaseId: activeScheduledRelease._id,
      releaseState: 'active',
    })

    const link = container.querySelector('a')
    // @ts-expect-error -- pre-existing, fix later
    const searchParams = JSON.parse(link.getAttribute('data-search-params'))
    expect(searchParams).toContainEqual(['perspective', 'rActive'])
  })

  it('creates link without search params when release state is archived', async () => {
    const {container} = await renderTest({
      documentId: 'doc123',
      documentTypeName: 'post',
      releaseId: activeScheduledRelease._id,
      releaseState: 'archived',
    })

    const link = container.querySelector('a')
    // @ts-expect-error -- pre-existing, fix later
    const searchParams = JSON.parse(link.getAttribute('data-search-params'))
    expect(searchParams).toBeNull()
  })

  it('creates link with variant and release perspective sticky params', async () => {
    const {container} = await renderTest({
      documentId: 'versions.buz.doc123',
      documentTypeName: 'post',
      releaseId: activeScheduledRelease._id,
      releaseState: 'active',
      variantId: 'alpha-audience',
    })

    const link = container.querySelector('a')
    // @ts-expect-error -- pre-existing, fix later
    const searchParams = JSON.parse(link.getAttribute('data-search-params'))
    expect(searchParams).toEqual([
      ['variant', 'alpha-audience'],
      ['perspective', 'rActive'],
    ])
  })

  describe('preview value resolution', () => {
    it('resolves the version through the release perspective', async () => {
      await renderTest({
        documentId: 'versions.rActive.doc123',
        documentTypeName: 'post',
        releaseId: activeScheduledRelease._id,
        releaseState: 'active',
      })

      expect(useDocumentPreviewValues).toHaveBeenLastCalledWith({
        documentId: 'versions.rActive.doc123',
        documentType: 'post',
        perspectiveStack: ['rActive'],
      })
    })

    it('resolves the published document while an unpublish is still pending', async () => {
      await renderTest({
        documentId: 'versions.rActive.doc123',
        documentTypeName: 'post',
        releaseId: activeScheduledRelease._id,
        releaseState: 'active',
        isGoingToUnpublish: true,
      })

      expect(useDocumentPreviewValues).toHaveBeenLastCalledWith({
        documentId: 'doc123',
        documentType: 'post',
        perspectiveStack: [],
      })
    })

    it('resolves the draft once the release has run the unpublish', async () => {
      await renderTest({
        documentId: 'versions.rPublished.doc123',
        documentTypeName: 'post',
        releaseId: publishedASAPRelease._id,
        releaseState: 'published',
        isGoingToUnpublish: true,
      })

      expect(useDocumentPreviewValues).toHaveBeenLastCalledWith({
        documentId: 'doc123',
        documentType: 'post',
        perspectiveStack: ['drafts'],
      })
    })

    // An archived release never ran, so its published documents are untouched and remain the right
    // preview source. Pinned so that widening the drafts branch has to be a deliberate change.
    it('resolves the published document for an archived release', async () => {
      await renderTest({
        documentId: 'versions.rArchived.doc123',
        documentTypeName: 'post',
        releaseId: archivedScheduledRelease._id,
        releaseState: 'archived',
        isGoingToUnpublish: true,
      })

      expect(useDocumentPreviewValues).toHaveBeenLastCalledWith({
        documentId: 'doc123',
        documentType: 'post',
        perspectiveStack: [],
      })
    })

    it('resolves the published document when no release state is given', async () => {
      await renderTest({
        documentId: 'versions.rActive.doc123',
        documentTypeName: 'post',
        releaseId: activeScheduledRelease._id,
        isGoingToUnpublish: true,
      })

      expect(useDocumentPreviewValues).toHaveBeenLastCalledWith({
        documentId: 'doc123',
        documentType: 'post',
        perspectiveStack: [],
      })
    })
  })
})
