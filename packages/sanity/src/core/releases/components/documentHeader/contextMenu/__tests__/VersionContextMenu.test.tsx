import {fireEvent, render, screen, waitFor} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {type ReleaseDocument} from '../../../../store/types'
import {VersionContextMenu} from '../VersionContextMenu'

vi.mock('sanity/router', () => ({
  IntentLink: ({children}: {children: React.ReactNode}) => <div>{children}</div>,
  route: {
    create: vi.fn(),
  },
}))

describe('VersionContextMenu', () => {
  const mockReleases: ReleaseDocument[] = [
    {
      _id: '_.releases.release1',
      name: 'release1',
      _type: 'system.release',
      _rev: 'rev1',
      _updatedAt: '',
      _createdAt: '',
      state: 'active',
      createdBy: 'safsd',
      metadata: {
        title: 'Release 1',
        releaseType: 'asap',
      },
    },
    {
      _id: '_.releases.release2',
      name: 'release2',
      _type: 'system.release',
      _rev: 'rev1',
      _createdAt: '',
      _updatedAt: '',
      createdBy: 'safsd',
      state: 'active',
      metadata: {
        title: 'Release 2',
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
