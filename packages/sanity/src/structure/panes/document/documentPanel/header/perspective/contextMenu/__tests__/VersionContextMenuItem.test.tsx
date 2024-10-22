import {render, screen} from '@testing-library/react'
import {type ReleaseDocument, type releaseType} from 'sanity'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../../../../test/testUtils/TestProvider'
import {VersionContextMenuItem} from '../VersionContextMenuItem'

const mockRelease: ReleaseDocument = {
  _id: '1',
  _type: 'release',
  title: 'Test Release',
  releaseType: 'scheduled',
  publishedAt: '2023-10-01T10:00:00Z',
  hue: 'gray',
  icon: 'string',
  authorId: '',
  _createdAt: '',
  _updatedAt: '',
  _rev: '',
}

vi.mock('sanity', async (importOriginal) => ({
  ...(await importOriginal()),
  useDateTimeFormat: vi.fn(() => ({
    format: (date: Date) => date.toLocaleString(),
  })),
  ReleaseAvatar: () => <div data-testid="release-avatar" />,
  getReleaseTone: vi.fn(),
  SANITY_VERSION: 'test',
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
    const scheduledRelease = {...mockRelease, releaseType: 'scheduled' as releaseType}

    render(<VersionContextMenuItem release={scheduledRelease} />, {wrapper})
    expect(screen.getByText('10/1/2023, 3:00:00 AM')).toBeInTheDocument()
  })

  it('renders release type as ASAP', async () => {
    const asapRelease = {...mockRelease, releaseType: 'asap' as releaseType}
    const wrapper = await createTestProvider()

    render(<VersionContextMenuItem release={asapRelease} />, {wrapper})
    expect(screen.getByText('ASAP')).toBeInTheDocument()
  })

  it('renders release type as undecided', async () => {
    const undecidedRelease = {...mockRelease, releaseType: 'undecided' as releaseType}
    const wrapper = await createTestProvider()

    render(<VersionContextMenuItem release={undecidedRelease} />, {wrapper})
    expect(screen.getByText('Undecided')).toBeInTheDocument()
  })

  it('renders "No Date" for scheduled release without date', async () => {
    const noDateRelease = {...mockRelease, publishedAt: undefined}
    const wrapper = await createTestProvider()

    render(<VersionContextMenuItem release={noDateRelease} />, {wrapper})
    expect(screen.getByText('No Date')).toBeInTheDocument()
  })

  it('renders ReleaseAvatar component', async () => {
    const wrapper = await createTestProvider()

    render(<VersionContextMenuItem release={mockRelease} />, {wrapper})
    expect(screen.getByTestId('release-avatar')).toBeInTheDocument()
  })
})
