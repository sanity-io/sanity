import {afterEach, describe, expect, jest, test} from '@jest/globals'
import {Menu} from '@sanity/ui'
import {fireEvent, render, screen} from '@testing-library/react'
import {type ReactNode} from 'react'
import {defineConfig} from 'sanity'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {structureUsEnglishLocaleBundle} from '../../../../structure/i18n'
import {StudioAnnouncementsMenuItem} from '../StudioAnnouncementsMenuItem'
import {type StudioAnnouncementDocument} from '../types'
import {useStudioAnnouncements} from '../useStudioAnnouncements'

jest.mock('../useStudioAnnouncements')
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
}
const useStudioAnnouncementsMock = useStudioAnnouncements as jest.Mock<
  typeof useStudioAnnouncements
>
const config = defineConfig({
  projectId: 'test',
  dataset: 'test',
})

async function createAnnouncementWrapper() {
  const wrapper = await createTestProvider({
    config,
    resources: [structureUsEnglishLocaleBundle],
  })

  return ({children}: {children: ReactNode}) => wrapper({children: <Menu>{children}</Menu>})
}

describe('StudioAnnouncementsMenuItem', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  test('renders null when there are no studio announcements', async () => {
    useStudioAnnouncementsMock.mockReturnValue({
      studioAnnouncements: [],
      unseenAnnouncements: [],
      onDialogOpen: jest.fn(),
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
      onDialogOpen: jest.fn(),
    })

    const wrapper = await createAnnouncementWrapper()

    render(<StudioAnnouncementsMenuItem text="Announcements" />, {
      wrapper,
    })

    expect(screen.getByText('Announcements')).toBeInTheDocument()
  })

  test('clicking on MenuItem calls onDialogOpen with "all"', async () => {
    const onDialogOpenMock = jest.fn()

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

    expect(onDialogOpenMock).toHaveBeenCalledWith('all')
  })
})
