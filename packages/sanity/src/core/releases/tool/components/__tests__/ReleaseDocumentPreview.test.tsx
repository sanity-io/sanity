import {render, screen, waitFor} from '@testing-library/react'
import {type ComponentProps} from 'react'
import {describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {activeASAPRelease, activeScheduledRelease} from '../../../__fixtures__/release.fixture'
import {releasesUsEnglishLocaleBundle} from '../../../i18n'
import {ReleaseDocumentPreview} from '../ReleaseDocumentPreview'

interface DocumentPresenceData {
  user: string
  sessionId: string
  lastActiveAt: string
}

const mockDocumentPresence: DocumentPresenceData[] = []

vi.mock('../../../../preview/components/SanityDefaultPreview', () => ({
  SanityDefaultPreview: vi.fn(({isPlaceholder, title, subtitle, status}) => (
    <div data-ui={isPlaceholder ? 'Placeholder' : 'Preview'}>
      {!isPlaceholder && title && <div>{title}</div>}
      {!isPlaceholder && subtitle && <div>{subtitle}</div>}
      {status}
    </div>
  )),
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

vi.mock('../../../../store/_legacy/presence/useDocumentPresence', () => ({
  useDocumentPresence: vi.fn(() => mockDocumentPresence),
}))

const mockPreviewValues = {
  title: 'Test Document',
  subtitle: 'Test Subtitle',
  media: null,
}

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
      previewValues: mockPreviewValues,
      isLoading: false,
    })

    expect(screen.getByText('Test Document')).toBeInTheDocument()
    expect(screen.getByText('Test Subtitle')).toBeInTheDocument()
  })

  it('renders in loading state', async () => {
    const {container} = await renderTest({
      documentId: 'doc123',
      documentTypeName: 'post',
      releaseId: activeASAPRelease._id,
      previewValues: mockPreviewValues,
      isLoading: true,
    })

    expect(container.querySelector('[data-ui="Placeholder"]')).toBeInTheDocument()
  })

  it('creates link with published perspective when release state is published', async () => {
    const {container} = await renderTest({
      documentId: 'doc123',
      documentTypeName: 'post',
      releaseId: activeASAPRelease._id,
      previewValues: mockPreviewValues,
      isLoading: false,
      releaseState: 'published',
    })

    const link = container.querySelector('a')
    const searchParams = JSON.parse(link.getAttribute('data-search-params'))
    expect(searchParams).toContainEqual(['perspective', 'published'])
  })

  it('creates link with release ID perspective when release state is not published', async () => {
    const {container} = await renderTest({
      documentId: 'doc123',
      documentTypeName: 'post',
      releaseId: activeScheduledRelease._id,
      previewValues: mockPreviewValues,
      isLoading: false,
      releaseState: 'active',
    })

    const link = container.querySelector('a')
    const searchParams = JSON.parse(link.getAttribute('data-search-params'))
    expect(searchParams).toContainEqual(['perspective', 'rActive'])
  })
})
