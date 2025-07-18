import {type ReleaseDocument} from '@sanity/client'
import {act, fireEvent, render, screen, waitFor} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {useDocumentPairPermissionsMockReturn} from '../../../../../../../test/mocks/useDocumentPairPermissions.mock'
import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {
  mockUseReleasePermissions,
  useReleasePermissionsMockReturn,
  useReleasesPermissionsMockReturnTrue,
} from '../../../../store/__tests__/__mocks/useReleasePermissions.mock'
import {VersionContextMenu} from '../VersionContextMenu'

vi.mock('sanity/router', async (importOriginal) => ({
  ...(await importOriginal()),
  IntentLink: ({children}: {children: React.ReactNode}) => <div>{children}</div>,
  route: {
    create: vi.fn(),
  },
}))

vi.mock('../../../../store/useReleasePermissions', () => ({
  useReleasePermissions: vi.fn(() => useReleasePermissionsMockReturn),
}))

vi.mock('../../../../../store/_legacy/grants/documentPairPermissions', () => ({
  useDocumentPairPermissions: vi.fn(() => useDocumentPairPermissionsMockReturn),
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
    type: 'document',
  }

  it('renders the menu items correctly', async () => {
    mockUseReleasePermissions.mockReturnValue(useReleasesPermissionsMockReturnTrue)

    const wrapper = await createTestProvider()

    render(<VersionContextMenu {...defaultProps} />, {wrapper})

    expect(screen.getByTestId('copy-version-to-release-button-group')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByTestId('copy-version-to-release-button-group')).not.toBeDisabled()
    })

    await act(() => {
      fireEvent.click(screen.getByTestId('copy-version-to-release-button-group'))
    })
    await waitFor(() => {
      expect(screen.getByTestId('create-new-release-button')).toBeInTheDocument()
      expect(screen.getByText('Release 1')).toBeInTheDocument()
      expect(screen.getByText('Release 2')).toBeInTheDocument()
    })
  })

  it('calls onCreateRelease when "New release" is clicked', async () => {
    mockUseReleasePermissions.mockReturnValue(useReleasesPermissionsMockReturnTrue)

    const wrapper = await createTestProvider()

    render(<VersionContextMenu {...defaultProps} />, {wrapper})

    expect(screen.getByTestId('copy-version-to-release-button-group')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByTestId('copy-version-to-release-button-group')).not.toBeDisabled()
    })

    await act(() => {
      fireEvent.click(screen.getByTestId('copy-version-to-release-button-group'))
    })

    await waitFor(() => {
      fireEvent.click(screen.getByTestId('create-new-release-button'))
    })
    expect(defaultProps.onCreateRelease).toHaveBeenCalled()
  })

  it('hides discard version on published chip', async () => {
    mockUseReleasePermissions.mockReturnValue(useReleasesPermissionsMockReturnTrue)

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
    mockUseReleasePermissions.mockReturnValue(useReleasesPermissionsMockReturnTrue)

    const wrapper = await createTestProvider()

    render(<VersionContextMenu {...defaultProps} />, {wrapper})

    await waitFor(() => {
      expect(screen.getByText('Discard version')).not.toBeDisabled()
    })

    await act(() => {
      fireEvent.click(screen.getByText('Discard version'))
    })
    expect(defaultProps.onDiscard).toHaveBeenCalled()
  })

  it('calls onCreateRelease when a "new release" is clicked', async () => {
    mockUseReleasePermissions.mockReturnValue(useReleasesPermissionsMockReturnTrue)

    const wrapper = await createTestProvider()

    render(<VersionContextMenu {...defaultProps} />, {wrapper})

    expect(screen.getByTestId('copy-version-to-release-button-group')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByTestId('copy-version-to-release-button-group')).not.toBeDisabled()
    })

    await act(() => {
      fireEvent.click(screen.getByTestId('copy-version-to-release-button-group'))
    })

    await waitFor(() => {
      fireEvent.click(screen.getByTestId('create-new-release-button'))
    })
    expect(defaultProps.onCreateRelease).toHaveBeenCalled()
  })

  it('calls onCreateVersion when a release is clicked and sets the perspective to the release', async () => {
    mockUseReleasePermissions.mockReturnValue(useReleasesPermissionsMockReturnTrue)

    const wrapper = await createTestProvider()

    render(<VersionContextMenu {...defaultProps} />, {wrapper})

    expect(screen.getByTestId('copy-version-to-release-button-group')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByTestId('copy-version-to-release-button-group')).not.toBeDisabled()
    })

    await act(() => {
      fireEvent.click(screen.getByTestId('copy-version-to-release-button-group'))
    })

    await waitFor(() => {
      fireEvent.click(screen.getByText('Release 2'))
    })
    expect(defaultProps.onCreateRelease).toHaveBeenCalled()
  })

  it('disables the copy version to option if the document is going to be unpublished', async () => {
    mockUseReleasePermissions.mockReturnValue(useReleasesPermissionsMockReturnTrue)

    const wrapper = await createTestProvider()

    render(<VersionContextMenu {...defaultProps} isGoingToUnpublish />, {wrapper})

    await waitFor(() => {
      expect(screen.getByTestId('copy-version-to-release-button-group')).toBeDisabled()
    })
  })
})
