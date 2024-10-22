import {fireEvent, render, screen, waitFor} from '@testing-library/react'
import {type ReleaseDocument} from 'sanity'
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
    /**
     * @todo
     * is there no better way of mocking this?? */
    useTranslation: vi.fn().mockReturnValue({
      t: vi.fn().mockImplementation((key: string) => {
        const translations: Record<string, string> = {
          'release.action.discard-version': 'Discard version',
        }
        return translations[key]
      }),
    }),
  }
})

vi.mock('sanity/router', () => ({
  IntentLink: ({children}: {children: React.ReactNode}) => <div>{children}</div>,
  route: {
    create: vi.fn(),
  },
}))

describe('VersionContextMenu', () => {
  const mockReleases: ReleaseDocument[] = [
    {
      _id: 'release1',
      title: 'Release 1',
      _type: 'release',
      hue: 'gray',
      icon: 'string',
      authorId: '',
      releaseType: 'asap',
      _createdAt: '',
      _updatedAt: '',
      _rev: '',
    },
    {
      _id: 'release2',
      title: 'Release 2',
      _type: 'release',
      hue: 'gray',
      icon: 'string',
      authorId: '',
      releaseType: 'asap',
      _createdAt: '',
      _updatedAt: '',
      _rev: '',
    },
  ]

  const defaultProps = {
    documentId: 'versions.bundle.doc1',
    releases: mockReleases,
    releasesLoading: false,
    documentType: 'testType',
    fromRelease: 'release1',
    isVersion: true,
    onDiscard: vi.fn(),
    onCreateRelease: vi.fn(),
    disabled: false,
  }

  it('renders the menu items correctly', async () => {
    const wrapper = await createTestProvider()

    render(<VersionContextMenu {...defaultProps} />, {wrapper})

    expect(screen.getByText('Copy version to')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Copy version to'))
    await waitFor(() => {
      expect(screen.getByText('New release')).toBeInTheDocument()
      expect(screen.getByText('Release 1')).toBeInTheDocument()
      expect(screen.getByText('Release 2')).toBeInTheDocument()
    })
  })

  it('calls onCreateRelease when "New release" is clicked', async () => {
    const wrapper = await createTestProvider()

    render(<VersionContextMenu {...defaultProps} />, {wrapper})

    fireEvent.click(screen.getByText('Copy version to'))
    await waitFor(() => {
      fireEvent.click(screen.getByText('New release'))
    })
    expect(defaultProps.onCreateRelease).toHaveBeenCalled()
  })

  it.todo('hides discard version on published chip', async () => {
    const wrapper = await createTestProvider()
    const publishedProps = {
      ...defaultProps,
      documentId: 'testid',
      isVersion: false,
    }

    render(<VersionContextMenu {...publishedProps} />, {wrapper})

    expect(screen.getByText('Discard version')).not.toBeInTheDocument()
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
      fireEvent.click(screen.getByText('New release'))
    })
    expect(defaultProps.onCreateRelease).toHaveBeenCalled()
  })

  it.todo(
    'executes createVersion and sets perspective when handleAddVersion is called',
    async () => {
      const wrapper = await createTestProvider()
      const {createVersion} = require('sanity').useDocumentOperation()
      const {setPerspective} = require('sanity').usePerspective()

      render(<VersionContextMenu {...defaultProps} />, {wrapper})

      fireEvent.click(screen.getByText('Copy version to'))
      await waitFor(() => {
        fireEvent.click(screen.getByText('Release 1'))
      })

      await waitFor(() => {
        expect(createVersion.execute).toHaveBeenCalled()
        expect(setPerspective).toHaveBeenCalledWith('release1')
      })
    },
  )
})
