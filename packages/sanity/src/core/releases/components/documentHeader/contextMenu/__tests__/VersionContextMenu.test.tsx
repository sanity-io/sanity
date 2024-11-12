import {fireEvent, render, screen, waitFor} from '@testing-library/react'
import * as sanity from 'sanity'
import {describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {releasesUsEnglishLocaleBundle} from '../../../../i18n'
import {VersionContextMenu} from '../VersionContextMenu'

vi.mock('sanity/router', () => ({
  IntentLink: ({children}: {children: React.ReactNode}) => <div>{children}</div>,
  route: {
    create: vi.fn(),
  },
}))

describe('VersionContextMenu', () => {
  const mockReleases: sanity.ReleaseDocument[] = [
    {
      _id: '_.releases.release1',
      name: 'release1',
      _type: 'system.release',
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

  it.todo('renders the menu items correctly', async () => {
    const wrapper = await createTestProvider({
      resources: [releasesUsEnglishLocaleBundle],
    })

    render(<VersionContextMenu {...defaultProps} />, {wrapper})

    expect(screen.getByText('Copy version to')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Copy version to'))
    await waitFor(() => {
      expect(screen.getByText('New Release')).toBeInTheDocument()
      expect(screen.getByText('Release 1')).toBeInTheDocument()
      expect(screen.getByText('Release 2')).toBeInTheDocument()
    })
  })

  it.todo('calls onCreateRelease when "New release" is clicked', async () => {
    const wrapper = await createTestProvider({
      resources: [releasesUsEnglishLocaleBundle],
    })

    render(<VersionContextMenu {...defaultProps} />, {wrapper})
    fireEvent.click(screen.getByText('Copy version to'))
    await waitFor(() => {
      fireEvent.click(screen.getByText('New Release'))
    })
    expect(defaultProps.onCreateRelease).toHaveBeenCalled()
  })

  it('hides discard version on published chip', async () => {
    const wrapper = await createTestProvider({
      resources: [releasesUsEnglishLocaleBundle],
    })

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
    const wrapper = await createTestProvider({
      resources: [releasesUsEnglishLocaleBundle],
    })

    render(<VersionContextMenu {...defaultProps} />, {wrapper})

    await waitFor(() => {
      fireEvent.click(screen.getByText('Discard version'))
    })
    expect(defaultProps.onDiscard).toHaveBeenCalled()
  })

  it('hides discard version on published chip', async () => {
    const wrapper = await createTestProvider({
      resources: [releasesUsEnglishLocaleBundle],
    })

    const publishedProps = {
      ...defaultProps,
      documentId: 'testid',
      isVersion: false,
    }

    vi.spyOn(sanity, 'isPublishedId').mockReturnValue(true)

    render(<VersionContextMenu {...publishedProps} />, {wrapper})

    expect(screen.queryByTestId('discard')).not.toBeInTheDocument()
  })

  it.todo('disables menu items when the release is scheduled', async () => {
    /*const wrapper = await createTestProvider({
      resources: [releasesUsEnglishLocaleBundle],
    })

    const scheduledReleases: sanity.ReleaseDocument[] = [
      {
        _id: '_.releases.release2',
        name: 'release2',
        _type: 'system.release',
        _createdAt: '',
        _updatedAt: '',
        createdBy: 'rita',
        state: 'scheduled',
        metadata: {
          title: 'Release 2',
          releaseType: 'scheduled',
          intendedPublishAt: '2022-01-01T00:00:00Z',
        },
      },
    ]

    render(<VersionContextMenu {...defaultProps} releases={scheduledReleases} />, {wrapper})

    fireEvent.click(screen.getByText('Copy version to'))
    await waitFor(() => {
      const release1Item = screen.getByText('Release 2').closest('a')
      expect(release1Item).toHaveAttribute('aria-disabled', 'true')
    })*/
  })
})
