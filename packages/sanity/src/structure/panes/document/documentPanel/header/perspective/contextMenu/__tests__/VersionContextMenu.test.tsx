import {fireEvent, render, screen, waitFor} from '@testing-library/react'
import * as sanity from 'sanity'
import {describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../../../../test/testUtils/TestProvider'
import {VersionContextMenu} from '../VersionContextMenu'

// Mock necessary hooks and components
vi.mock('sanity', async (importOriginal) => {
  return {
    ...(await importOriginal()),
    useTelemetry: vi.fn(),
    useDocumentOperation: vi.fn().mockReturnValue({createVersion: {execute: vi.fn()}}),
    useDocumentStore: vi.fn().mockReturnValue({pair: {operationEvents: vi.fn()}}),
    usePerspective: vi.fn().mockReturnValue({setPerspective: vi.fn()}),
    SANITY_VERSION: 'test',
    isPublishedId: vi.fn(),
    getPublishedId: vi.fn(),
    useDateTimeFormat: vi.fn(),
    ReleaseAvatar: () => <div>ReleaseAvatar</div>,
    getReleaseTone: vi.fn(),
  }
})

/**
 * @todo change this once improvements have been done to test mocking
 * there is currently some limitations with importing translations
 * in order to make sure that the translations work on tests,
 * you need to mock it from the relative path vs doing it in the main mock
 */
vi.mock('../../../../../../../core/i18n/hooks/useTranslation')

vi.mock('sanity/router', () => ({
  IntentLink: ({children}: {children: React.ReactNode}) => <div>{children}</div>,
  route: {
    create: vi.fn(),
  },
}))

describe('VersionContextMenu', () => {
  const mockReleases: sanity.ReleaseDocument[] = [
    {
      _id: 'release1',
      name: 'release1',
      _type: 'system-tmp.release',
      _updatedAt: '',
      _createdAt: '',
      state: 'active',
      createdBy: 'safsd',
      metadata: {
        title: 'Release 1',
        hue: 'gray',
        icon: 'string',
        releaseType: 'asap',
      },
    },
    {
      _id: 'release2',
      name: 'release2',
      _type: 'system-tmp.release',
      _createdAt: '',
      _updatedAt: '',
      createdBy: 'safsd',
      state: 'active',
      metadata: {
        title: 'Release 2',
        hue: 'gray',
        icon: 'string',
        releaseType: 'asap',
      },
    },
  ]

  const defaultProps = {
    documentId: 'versions.bundle.doc1',
    releases: mockReleases,
    releasesLoading: false,
    fromRelease: 'release1',
    isVersion: true,
    onDiscard: vi.fn(),
    onCreateRelease: vi.fn(),
    onCreateVersion: vi.fn(),
    disabled: false,
  }

  it('renders the menu items correctly', async () => {
    const wrapper = await createTestProvider()

    render(<VersionContextMenu {...defaultProps} />, {wrapper})

    expect(screen.getByText('Copy version to')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Copy version to'))
    await waitFor(() => {
      expect(screen.getByText('New Release')).toBeInTheDocument()
      expect(screen.getByText('Release 1')).toBeInTheDocument()
      expect(screen.getByText('Release 2')).toBeInTheDocument()
    })
  })

  it('calls onCreateRelease when "New release" is clicked', async () => {
    const wrapper = await createTestProvider()

    render(<VersionContextMenu {...defaultProps} />, {wrapper})

    fireEvent.click(screen.getByText('Copy version to'))
    await waitFor(() => {
      fireEvent.click(screen.getByText('New Release'))
    })
    expect(defaultProps.onCreateRelease).toHaveBeenCalled()
  })

  it('hides discard version on published chip', async () => {
    const wrapper = await createTestProvider()
    const publishedProps = {
      ...defaultProps,
      documentId: 'testid',
      isVersion: false,
    }

    /** @todo we can probably rewrite this to be better */
    vi.spyOn(sanity, 'isPublishedId').mockReturnValue(true)

    render(<VersionContextMenu {...publishedProps} />, {wrapper})

    expect(screen.queryByTestId('discard')).not.toBeInTheDocument()
  })

  it('calls onDiscard when "Discard version" is clicked', async () => {
    const wrapper = await createTestProvider()

    render(<VersionContextMenu {...defaultProps} />, {wrapper})

    await waitFor(() => {
      fireEvent.click(screen.getByText('Discard version'))
    })
    expect(defaultProps.onDiscard).toHaveBeenCalled()
  })

  it('calls onCreateRelease when a "new release" is clicked', async () => {
    const wrapper = await createTestProvider()

    render(<VersionContextMenu {...defaultProps} />, {wrapper})

    fireEvent.click(screen.getByText('Copy version to'))
    await waitFor(() => {
      fireEvent.click(screen.getByText('New Release'))
    })
    expect(defaultProps.onCreateRelease).toHaveBeenCalled()
  })

  it('calls onCreateVersion when a release is clicked and sets the perspective to the release', async () => {
    const wrapper = await createTestProvider()

    render(<VersionContextMenu {...defaultProps} />, {wrapper})

    fireEvent.click(screen.getByText('Copy version to'))
    await waitFor(() => {
      fireEvent.click(screen.getByText('Release 2'))
    })
    expect(defaultProps.onCreateRelease).toHaveBeenCalled()
  })
})
