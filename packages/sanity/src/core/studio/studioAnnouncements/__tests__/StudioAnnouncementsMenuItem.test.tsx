/* eslint-disable camelcase */
import {Menu} from '@sanity/ui'
import {fireEvent, render, screen} from '@testing-library/react'
import {type ReactNode} from 'react'
import {afterEach, describe, expect, test, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {defineConfig} from '../../../config/defineConfig'
import {WhatsNewHelpMenuItemClicked} from '../__telemetry__/studioAnnouncements.telemetry'
import {StudioAnnouncementsMenuItem} from '../StudioAnnouncementsMenuItem'
import {type StudioAnnouncementDocument} from '../types'
import {useStudioAnnouncements} from '../useStudioAnnouncements'

vi.mock('../useStudioAnnouncements')
vi.mock('@sanity/telemetry/react', () => ({
  useTelemetry: vi.fn().mockReturnValue({
    log: vi.fn(),
  }),
}))

vi.mock('../../../version', () => ({
  SANITY_VERSION: '3.57.0',
}))

const MOCKED_ANNOUNCEMENT: StudioAnnouncementDocument = {
  _id: 'studioAnnouncement-1',
  _type: 'productAnnouncement',
  _rev: '1',
  _createdAt: '',
  _updatedAt: '',
  title: 'Announcement 1',
  body: [],
  announcementType: 'whats-new',
  publishedDate: '2024-09-10T14:44:00.000Z',
  audience: 'everyone',
  preHeader: "What's new",
  name: 'announcement-1',
}
const useStudioAnnouncementsMock = useStudioAnnouncements as ReturnType<typeof vi.fn>
const config = defineConfig({
  projectId: 'test',
  dataset: 'test',
})

async function createAnnouncementWrapper() {
  const wrapper = await createTestProvider({
    config,
    resources: [],
  })

  return ({children}: {children: ReactNode}) => wrapper({children: <Menu>{children}</Menu>})
}

describe('StudioAnnouncementsMenuItem', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  test('renders null when there are no studio announcements', async () => {
    useStudioAnnouncementsMock.mockReturnValue({
      studioAnnouncements: [],
      unseenAnnouncements: [],
      onDialogOpen: vi.fn(),
    })

    const wrapper = await createAnnouncementWrapper()

    const {container} = render(<StudioAnnouncementsMenuItem text="Announcements" />, {
      wrapper,
    })

    expect(container).not.toHaveTextContent('Announcements')
  })

  test('renders MenuItem when there are studio announcements', async () => {
    useStudioAnnouncementsMock.mockReturnValue({
      studioAnnouncements: [MOCKED_ANNOUNCEMENT],
      unseenAnnouncements: [],
      onDialogOpen: vi.fn(),
    })

    const wrapper = await createAnnouncementWrapper()

    render(<StudioAnnouncementsMenuItem text="Announcements" />, {
      wrapper,
    })

    expect(screen.getByText('Announcements')).toBeInTheDocument()
  })

  test('clicking on MenuItem calls onDialogOpen with "all"', async () => {
    const onDialogOpenMock = vi.fn()
    const mockLog = vi.fn()
    const {useTelemetry} = await import('@sanity/telemetry/react')
    ;(useTelemetry as ReturnType<typeof vi.fn>).mockReturnValue({log: mockLog})

    useStudioAnnouncementsMock.mockReturnValue({
      studioAnnouncements: [MOCKED_ANNOUNCEMENT],
      unseenAnnouncements: [],
      onDialogOpen: onDialogOpenMock,
    })

    const wrapper = await createAnnouncementWrapper()

    render(<StudioAnnouncementsMenuItem text="Announcements" />, {
      wrapper,
    })

    fireEvent.click(screen.getByText('Announcements'))

    expect(onDialogOpenMock).toHaveBeenCalledWith('help_menu')
    expect(mockLog).toHaveBeenCalledTimes(1)
    expect(mockLog).toHaveBeenCalledWith(WhatsNewHelpMenuItemClicked, {
      announcement_id: 'studioAnnouncement-1',
      announcement_title: 'Announcement 1',
      announcement_internal_name: 'announcement-1',
      source: 'studio',
      studio_version: '3.57.0',
    })
  })
})
