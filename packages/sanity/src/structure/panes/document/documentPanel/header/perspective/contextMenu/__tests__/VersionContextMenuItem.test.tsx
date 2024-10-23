import {render, screen} from '@testing-library/react'
import {type ReleaseDocument, type ReleaseType} from 'sanity'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../../../../test/testUtils/TestProvider'
import {VersionContextMenuItem} from '../VersionContextMenuItem'

const mockRelease: ReleaseDocument = {
  _id: '1',
  _type: 'system-tmp.release',
  createdBy: '',
  _createdAt: '',
  _updatedAt: '',
  state: 'active',
  name: '1',
  metadata: {
    title: 'Test Release',
    releaseType: 'scheduled',
    intendedPublishAt: '2023-10-01T10:00:00Z',
    hue: 'gray',
    icon: 'string',
  },
}

vi.mock('sanity', async (importOriginal) => ({
  ...(await importOriginal()),
  useDateTimeFormat: vi.fn(() => ({
    format: (date: Date) => date.toLocaleString(),
  })),
  ReleaseAvatar: () => <div data-testid="release-avatar" />,
  getReleaseTone: vi.fn(),
  SANITY_VERSION: 'test',

  /**
   * @todo
   * is there no better way of mocking this?? */
  useTranslation: vi.fn().mockReturnValue({
    t: vi.fn().mockImplementation((key: string) => {
      const translations: Record<string, string> = {
        'release.chip.tooltip.unknown-date': 'Unknown date',
        'release.type.asap': 'ASAP',
        'release.type.undecided': 'Undecided',
      }
      return translations[key]
    }),
  }),
}))

describe('VersionContextMenuItem', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders release title', async () => {
    const wrapper = await createTestProvider()
    render(<VersionContextMenuItem release={mockRelease} />, {wrapper})
    expect(screen.getByText('Test Release')).toBeInTheDocument()
  })

  it('renders release type as scheduled with date', async () => {
    const wrapper = await createTestProvider()
    const scheduledRelease = {...mockRelease, releaseType: 'scheduled' as ReleaseType}

    render(<VersionContextMenuItem release={scheduledRelease} />, {wrapper})
    expect(screen.getByText('10/1/2023, 3:00:00 AM')).toBeInTheDocument()
  })

  it('renders release type as ASAP', async () => {
    const asapRelease: ReleaseDocument = {
      ...mockRelease,
      metadata: {...mockRelease.metadata, releaseType: 'asap'},
    }
    const wrapper = await createTestProvider()

    render(<VersionContextMenuItem release={asapRelease} />, {wrapper})
    expect(screen.getByText('ASAP')).toBeInTheDocument()
  })

  it('renders release type as undecided', async () => {
    const asapRelease: ReleaseDocument = {
      ...mockRelease,
      metadata: {...mockRelease.metadata, releaseType: 'undecided'},
    }
    const wrapper = await createTestProvider()

    render(<VersionContextMenuItem release={asapRelease} />, {wrapper})
    expect(screen.getByText('Undecided')).toBeInTheDocument()
  })

  it('renders "Unknown date" for scheduled release without date', async () => {
    const noDateRelease: ReleaseDocument = {
      ...mockRelease,
      metadata: {...mockRelease.metadata, releaseType: 'scheduled', intendedPublishAt: undefined},
    }
    const wrapper = await createTestProvider()

    render(<VersionContextMenuItem release={noDateRelease} />, {wrapper})
    expect(screen.getByText('Unknown date')).toBeInTheDocument()
  })

  it('renders ReleaseAvatar component', async () => {
    const wrapper = await createTestProvider()

    render(<VersionContextMenuItem release={mockRelease} />, {wrapper})
    expect(screen.getByTestId('release-avatar')).toBeInTheDocument()
  })
})
