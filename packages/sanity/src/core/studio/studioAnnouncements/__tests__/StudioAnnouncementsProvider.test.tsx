/* eslint-disable camelcase */
import {beforeAll, beforeEach, describe, expect, jest, test} from '@jest/globals'
import {fireEvent, render, renderHook} from '@testing-library/react'
import {type ReactNode} from 'react'
import {defineConfig} from 'sanity'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {structureUsEnglishLocaleBundle} from '../../../../structure/i18n'
import {StudioAnnouncementsProvider} from '../StudioAnnouncementsProvider'
import {type StudioAnnouncementDocument} from '../types'
import {useSeenAnnouncements} from '../useSeenAnnouncements'
import {useStudioAnnouncements} from '../useStudioAnnouncements'

jest.mock('@sanity/telemetry/react', () => ({
  useTelemetry: jest.fn().mockReturnValue({
    log: jest.fn(),
  }),
}))

jest.mock('@sanity/client', () => ({
  createClient: jest.fn().mockReturnValue({
    observable: {
      fetch: jest.fn(),
    },
  }),
}))

jest.mock('../useSeenAnnouncements')
jest.mock('../../../version', () => ({
  SANITY_VERSION: '3.57.0',
}))

const seenAnnouncementsMock = useSeenAnnouncements as jest.Mock<typeof useSeenAnnouncements>

const config = defineConfig({
  projectId: 'test',
  dataset: 'test',
})
async function createAnnouncementWrapper() {
  const wrapper = await createTestProvider({
    config,
    resources: [structureUsEnglishLocaleBundle],
  })

  return ({children}: {children: ReactNode}) =>
    wrapper({children: <StudioAnnouncementsProvider>{children}</StudioAnnouncementsProvider>})
}

const mockAnnouncements = [
  {
    _id: 'studioAnnouncement-1',
    _type: 'productAnnouncement',
    _rev: '1',
    _createdAt: '2024-09-10T14:44:00.000Z',
    _updatedAt: "2024-09-10T14:44:00.000Z'",
    title: 'Announcement 1',
    body: [],
    announcementType: 'whats-new',
    publishedDate: '2024-09-10T14:44:00.000Z',
    audience: 'everyone',
  },
  {
    _id: 'studioAnnouncement-2',
    _type: 'productAnnouncement',
    _rev: '1',
    _createdAt: '2024-09-10T14:44:00.000Z',
    _updatedAt: "2024-09-10T14:44:00.000Z'",
    title: 'Announcement 2',
    body: [],
    announcementType: 'whats-new',
    publishedDate: '2024-09-10T14:44:00.000Z',
    audience: 'everyone',
  },
]

describe('StudioAnnouncementsProvider', () => {
  let wrapper = ({children}: {children: ReactNode}) => children
  beforeAll(async () => {
    wrapper = await createAnnouncementWrapper()
  })
  describe('if seen announcements is loading', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      seenAnnouncementsMock.mockReturnValue(['loading', jest.fn()])
      const {createClient} = require('@sanity/client')

      const mockFetch = createClient().observable.fetch as jest.Mock
      mockFetch.mockReturnValue({
        subscribe: ({next}: any) => {
          next(mockAnnouncements)
          return {unsubscribe: jest.fn()}
        },
      })
    })
    test('returns empty unseen announcements ', () => {
      const {result} = renderHook(() => useStudioAnnouncements(), {
        wrapper,
      })

      expect(result.current.unseenAnnouncements).toEqual([])
      expect(result.current.studioAnnouncements).toEqual(mockAnnouncements)
    })
    test("if unseen is empty, card doesn't show ", () => {
      const {queryByText} = render(null, {wrapper})

      expect(queryByText("What's new")).toBeNull()
    })
  })
  describe('if seen announcements is not loading and has no values', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      seenAnnouncementsMock.mockReturnValue([[], jest.fn()])

      const {createClient} = require('@sanity/client')
      const mockFetch = createClient().observable.fetch as jest.Mock
      mockFetch.mockReturnValue({
        subscribe: ({next}: any) => {
          next(mockAnnouncements)
          return {unsubscribe: jest.fn()}
        },
      })
    })
    test('returns unseen announcements', () => {
      const {result} = renderHook(() => useStudioAnnouncements(), {
        wrapper,
      })
      expect(result.current.unseenAnnouncements).toEqual(mockAnnouncements)
      expect(result.current.studioAnnouncements).toEqual(mockAnnouncements)
    })
    test('unseen is not empty, card shows', () => {
      const {getByText} = render(null, {wrapper})

      expect(getByText("What's new")).toBeInTheDocument()
      expect(getByText(mockAnnouncements[0].title)).toBeInTheDocument()
    })
  })
  describe('if seen announcements has values', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      // It doesn't show the first element
      seenAnnouncementsMock.mockReturnValue([['studioAnnouncement-1'], jest.fn()])

      const {createClient} = require('@sanity/client')
      const mockFetch = createClient().observable.fetch as jest.Mock
      mockFetch.mockReturnValue({
        subscribe: ({next}: any) => {
          next(mockAnnouncements)
          return {unsubscribe: jest.fn()}
        },
      })
    })
    test('returns unseen announcements', () => {
      const {result} = renderHook(() => useStudioAnnouncements(), {
        wrapper,
      })
      expect(result.current.unseenAnnouncements).toEqual([mockAnnouncements[1]])
      expect(result.current.studioAnnouncements).toEqual(mockAnnouncements)
    })
    test('unseen is not empty, card shows', () => {
      const {getByText} = render(null, {wrapper})

      expect(getByText("What's new")).toBeInTheDocument()
      expect(getByText(mockAnnouncements[1].title)).toBeInTheDocument()
    })
  })
  describe('test components interactions', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      // It doesn't show the first element
      seenAnnouncementsMock.mockReturnValue([['studioAnnouncement-1'], jest.fn()])

      const {createClient} = require('@sanity/client')
      const mockFetch = createClient().observable.fetch as jest.Mock
      mockFetch.mockReturnValue({
        subscribe: ({next}: any) => {
          next(mockAnnouncements)
          return {unsubscribe: jest.fn()}
        },
      })
    })
    test('clicks on card, it opens dialog and card is hidden, shows only the unseen announcements', () => {
      const mockLog = jest.fn()
      const {useTelemetry} = require('@sanity/telemetry/react')
      useTelemetry.mockReturnValue({log: mockLog})

      const {queryByText, getByLabelText} = render(null, {wrapper})

      expect(queryByText("What's new")).toBeInTheDocument()
      expect(queryByText(mockAnnouncements[1].title)).toBeInTheDocument()
      const cardButton = getByLabelText('Open announcements')
      fireEvent.click(cardButton)

      expect(queryByText("What's new")).toBeNull()
      // The first announcement is seen, so it's not rendered
      expect(queryByText(mockAnnouncements[0].title)).toBeNull()
      // The second announcement is unseen, so it's rendered
      expect(queryByText(mockAnnouncements[1].title)).toBeInTheDocument()

      // Opening the dialog calls the telemetry only once, with the seen card
      expect(mockLog).toBeCalledTimes(2)
      expect(mockLog).toBeCalledWith(
        {
          description: 'User viewed the product announcement card',
          name: 'Product Announcement Card Seen',
          schema: undefined,
          type: 'log',
          version: 1,
        },
        {
          announcement_id: 'studioAnnouncement-2',
          announcement_title: 'Announcement 2',
          source: 'studio',
          studio_version: '3.57.0',
        },
      )
      expect(mockLog).toBeCalledWith(
        {
          description: 'User clicked the product announcement card',
          name: 'Product Announcement Card Clicked',
          schema: undefined,
          type: 'log',
          version: 1,
        },
        {
          announcement_id: 'studioAnnouncement-2',
          announcement_title: 'Announcement 2',
          source: 'studio',
          studio_version: '3.57.0',
        },
      )
    })

    test("dismisses card, then it's hidden, dialog doesn't render", () => {
      const mockLog = jest.fn()
      const {useTelemetry} = require('@sanity/telemetry/react')
      useTelemetry.mockReturnValue({log: mockLog})

      const {queryByText, getByLabelText} = render(null, {wrapper})

      expect(queryByText("What's new")).toBeInTheDocument()
      expect(queryByText(mockAnnouncements[1].title)).toBeInTheDocument()
      const closeButton = getByLabelText('Dismiss announcements')
      fireEvent.click(closeButton)
      expect(queryByText("What's new")).toBeNull()
      expect(queryByText(mockAnnouncements[1].title)).toBeNull()

      // Dismissing the card calls telemetry with the seen and dismiss logs
      expect(mockLog).toBeCalledTimes(2)
      expect(mockLog).toBeCalledWith(
        {
          description: 'User viewed the product announcement card',
          name: 'Product Announcement Card Seen',
          schema: undefined,
          type: 'log',
          version: 1,
        },
        {
          announcement_id: 'studioAnnouncement-2',
          announcement_title: 'Announcement 2',
          source: 'studio',
          studio_version: '3.57.0',
        },
      )
      expect(mockLog).toBeCalledWith(
        {
          description: 'User dismissed the product announcement card',
          name: 'Product Announcement Card Dismissed',
          schema: undefined,
          type: 'log',
          version: 1,
        },
        {
          announcement_id: 'studioAnnouncement-2',
          announcement_title: 'Announcement 2',
          source: 'studio',
          studio_version: '3.57.0',
        },
      )
    })

    test('dismisses dialog, card and dialog are hidden', () => {
      const mockLog = jest.fn()
      const {useTelemetry} = require('@sanity/telemetry/react')
      useTelemetry.mockReturnValue({log: mockLog})

      const {queryByText, getByLabelText} = render(null, {wrapper})

      expect(queryByText("What's new")).toBeInTheDocument()
      expect(queryByText(mockAnnouncements[1].title)).toBeInTheDocument()
      const cardButton = getByLabelText('Open announcements')
      fireEvent.click(cardButton)
      expect(queryByText("What's new")).toBeNull()
      expect(queryByText(mockAnnouncements[1].title)).toBeInTheDocument()

      const closeButton = getByLabelText('Close dialog')
      fireEvent.click(closeButton)
      expect(queryByText("What's new")).toBeNull()
      expect(queryByText(mockAnnouncements[1].title)).toBeNull()

      expect(mockLog).toBeCalledTimes(3)
      expect(mockLog).toBeCalledWith(
        {
          description: 'User viewed the product announcement card',
          name: 'Product Announcement Card Seen',
          schema: undefined,
          type: 'log',
          version: 1,
        },
        {
          announcement_id: 'studioAnnouncement-2',
          announcement_title: 'Announcement 2',
          source: 'studio',
          studio_version: '3.57.0',
        },
      )
      expect(mockLog).toBeCalledWith(
        {
          description: 'User clicked the product announcement card',
          name: 'Product Announcement Card Clicked',
          schema: undefined,
          type: 'log',
          version: 1,
        },
        {
          announcement_id: 'studioAnnouncement-2',
          announcement_title: 'Announcement 2',
          source: 'studio',
          studio_version: '3.57.0',
        },
      )
      expect(mockLog).toBeCalledWith(
        {
          description: 'User dismissed the product announcement modal ',
          name: 'Product Announcement Dismissed',
          schema: undefined,
          type: 'log',
          version: 1,
        },
        {
          announcement_id: 'studioAnnouncement-2',
          announcement_title: 'Announcement 2',
          origin: 'card',
          source: 'studio',
          studio_version: '3.57.0',
        },
      )
    })
    test('opens the dialog from outside the card, so it shows all unseen', () => {
      const Component = () => {
        const {onDialogOpen} = useStudioAnnouncements()
        return (
          // eslint-disable-next-line react/jsx-no-bind
          <button onClick={() => onDialogOpen('help_menu')} type="button">
            Open dialog
          </button>
        )
      }

      const {queryByText, getByRole} = render(<Component />, {wrapper})

      expect(queryByText("What's new")).toBeInTheDocument()
      expect(queryByText(mockAnnouncements[1].title)).toBeInTheDocument()

      const openDialogButton = getByRole('button', {name: 'Open dialog'})
      fireEvent.click(openDialogButton)

      // The card closes even if we open it from somewhere else
      expect(queryByText("What's new")).toBeNull()
      // The first announcement is seen, it's rendered because it's showing all
      expect(queryByText(mockAnnouncements[0].title)).toBeInTheDocument()
      // The second announcement is unseen, so it's rendered
      expect(queryByText(mockAnnouncements[1].title)).toBeInTheDocument()
    })
  })
  describe('tests audiences - studio version is 3.57.0', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      // It doesn't show the first element
      seenAnnouncementsMock.mockReturnValue([[], jest.fn()])
    })
    test('if the audience is everyone, it shows the announcement regardless the version', () => {
      const {createClient} = require('@sanity/client')
      const announcements = [
        {
          _id: 'studioAnnouncement-1',
          _type: 'productAnnouncement',
          _rev: '1',
          _createdAt: '2024-09-10T14:44:00.000Z',
          _updatedAt: "2024-09-10T14:44:00.000Z'",
          title: 'Announcement 1',
          body: [],
          announcementType: 'whats-new',
          publishedDate: '2024-09-10T14:44:00.000Z',
          audience: 'everyone',
        },
      ]
      const mockFetch = createClient().observable.fetch as jest.Mock
      mockFetch.mockReturnValue({
        subscribe: ({next}: any) => {
          next(announcements)
          return {unsubscribe: jest.fn()}
        },
      })

      const {result} = renderHook(() => useStudioAnnouncements(), {
        wrapper,
      })

      expect(result.current.unseenAnnouncements).toEqual(announcements)
      expect(result.current.studioAnnouncements).toEqual(announcements)
    })
    test('if the audience is above-version and studio version is not above', () => {
      const {createClient} = require('@sanity/client')
      const announcements: StudioAnnouncementDocument[] = [
        {
          _id: 'studioAnnouncement-1',
          _type: 'productAnnouncement',
          _rev: '1',
          _createdAt: '2024-09-10T14:44:00.000Z',
          _updatedAt: "2024-09-10T14:44:00.000Z'",
          title: 'Announcement 1',
          body: [],
          announcementType: 'whats-new',
          publishedDate: '2024-09-10T14:44:00.000Z',
          audience: 'above-version',
          studioVersion: '3.57.0',
        },
      ]
      const mockFetch = createClient().observable.fetch as jest.Mock
      mockFetch.mockReturnValue({
        subscribe: ({next}: any) => {
          next(announcements)
          return {unsubscribe: jest.fn()}
        },
      })

      const {result} = renderHook(() => useStudioAnnouncements(), {
        wrapper,
      })

      expect(result.current.unseenAnnouncements).toEqual([])
      expect(result.current.studioAnnouncements).toEqual([])
    })
    test('if the audience is above-version and studio version is above', () => {
      const {createClient} = require('@sanity/client')
      const announcements: StudioAnnouncementDocument[] = [
        {
          _id: 'studioAnnouncement-1',
          _type: 'productAnnouncement',
          _rev: '1',
          _createdAt: '2024-09-10T14:44:00.000Z',
          _updatedAt: "2024-09-10T14:44:00.000Z'",
          title: 'Announcement 1',
          body: [],
          announcementType: 'whats-new',
          publishedDate: '2024-09-10T14:44:00.000Z',
          audience: 'above-version',
          studioVersion: '3.56.0',
        },
      ]
      const mockFetch = createClient().observable.fetch as jest.Mock
      mockFetch.mockReturnValue({
        subscribe: ({next}: any) => {
          next(announcements)
          return {unsubscribe: jest.fn()}
        },
      })

      const {result} = renderHook(() => useStudioAnnouncements(), {
        wrapper,
      })

      expect(result.current.unseenAnnouncements).toEqual(announcements)
      expect(result.current.studioAnnouncements).toEqual(announcements)
    })
    test('if the audience is specific-version and studio matches ', () => {
      const {createClient} = require('@sanity/client')
      const announcements: StudioAnnouncementDocument[] = [
        {
          _id: 'studioAnnouncement-1',
          _type: 'productAnnouncement',
          _rev: '1',
          _createdAt: '2024-09-10T14:44:00.000Z',
          _updatedAt: "2024-09-10T14:44:00.000Z'",
          title: 'Announcement 1',
          body: [],
          announcementType: 'whats-new',
          publishedDate: '2024-09-10T14:44:00.000Z',
          audience: 'specific-version',
          studioVersion: '3.57.0',
        },
      ]
      const mockFetch = createClient().observable.fetch as jest.Mock
      mockFetch.mockReturnValue({
        subscribe: ({next}: any) => {
          next(announcements)
          return {unsubscribe: jest.fn()}
        },
      })

      const {result} = renderHook(() => useStudioAnnouncements(), {
        wrapper,
      })

      expect(result.current.unseenAnnouncements).toEqual(announcements)
      expect(result.current.studioAnnouncements).toEqual(announcements)
    })
    test('if the audience is specific-version and studio doesnt match ', () => {
      const {createClient} = require('@sanity/client')
      const announcements: StudioAnnouncementDocument[] = [
        {
          _id: 'studioAnnouncement-1',
          _type: 'productAnnouncement',
          _rev: '1',
          _createdAt: '2024-09-10T14:44:00.000Z',
          _updatedAt: "2024-09-10T14:44:00.000Z'",
          title: 'Announcement 1',
          body: [],
          announcementType: 'whats-new',
          publishedDate: '2024-09-10T14:44:00.000Z',
          audience: 'specific-version',
          studioVersion: '3.56.0',
        },
      ]
      const mockFetch = createClient().observable.fetch as jest.Mock
      mockFetch.mockReturnValue({
        subscribe: ({next}: any) => {
          next(announcements)
          return {unsubscribe: jest.fn()}
        },
      })

      const {result} = renderHook(() => useStudioAnnouncements(), {
        wrapper,
      })

      expect(result.current.unseenAnnouncements).toEqual([])
      expect(result.current.studioAnnouncements).toEqual([])
    })
    test('if the audience is below-version and studio is above', () => {
      const {createClient} = require('@sanity/client')
      const announcements: StudioAnnouncementDocument[] = [
        {
          _id: 'studioAnnouncement-1',
          _type: 'productAnnouncement',
          _rev: '1',
          _createdAt: '2024-09-10T14:44:00.000Z',
          _updatedAt: "2024-09-10T14:44:00.000Z'",
          title: 'Announcement 1',
          body: [],
          announcementType: 'whats-new',
          publishedDate: '2024-09-10T14:44:00.000Z',
          audience: 'below-version',
          studioVersion: '3.57.0',
        },
      ]
      const mockFetch = createClient().observable.fetch as jest.Mock
      mockFetch.mockReturnValue({
        subscribe: ({next}: any) => {
          next(announcements)
          return {unsubscribe: jest.fn()}
        },
      })

      const {result} = renderHook(() => useStudioAnnouncements(), {
        wrapper,
      })

      expect(result.current.unseenAnnouncements).toEqual([])
      expect(result.current.studioAnnouncements).toEqual([])
    })
    test('if the audience is below-version and studio is below', () => {
      const {createClient} = require('@sanity/client')
      const announcements: StudioAnnouncementDocument[] = [
        {
          _id: 'studioAnnouncement-1',
          _type: 'productAnnouncement',
          _rev: '1',
          _createdAt: '2024-09-10T14:44:00.000Z',
          _updatedAt: "2024-09-10T14:44:00.000Z'",
          title: 'Announcement 1',
          body: [],
          announcementType: 'whats-new',
          publishedDate: '2024-09-10T14:44:00.000Z',
          audience: 'below-version',
          studioVersion: '3.58.0',
        },
      ]
      const mockFetch = createClient().observable.fetch as jest.Mock
      mockFetch.mockReturnValue({
        subscribe: ({next}: any) => {
          next(announcements)
          return {unsubscribe: jest.fn()}
        },
      })

      const {result} = renderHook(() => useStudioAnnouncements(), {
        wrapper,
      })

      expect(result.current.unseenAnnouncements).toEqual(announcements)
      expect(result.current.studioAnnouncements).toEqual(announcements)
    })
  })
  describe('storing seen announcements', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })
    test('when the card is dismissed, and only 1 announcement received', () => {
      const {createClient} = require('@sanity/client')
      const saveSeenAnnouncementsMock = jest.fn()
      seenAnnouncementsMock.mockReturnValue([[], saveSeenAnnouncementsMock])

      const mockFetch = createClient().observable.fetch as jest.Mock
      mockFetch.mockReturnValue({
        subscribe: ({next}: any) => {
          next([mockAnnouncements[0]])
          return {unsubscribe: jest.fn()}
        },
      })
      const {getByLabelText} = render(null, {wrapper})

      const closeButton = getByLabelText('Dismiss announcements')
      fireEvent.click(closeButton)
      expect(saveSeenAnnouncementsMock).toHaveBeenCalledWith([mockAnnouncements[0]._id])
    })
    test('when the card is dismissed, and 2 announcements are received', () => {
      const {createClient} = require('@sanity/client')
      const saveSeenAnnouncementsMock = jest.fn()
      seenAnnouncementsMock.mockReturnValue([[], saveSeenAnnouncementsMock])

      const mockFetch = createClient().observable.fetch as jest.Mock
      mockFetch.mockReturnValue({
        subscribe: ({next}: any) => {
          next(mockAnnouncements)
          return {unsubscribe: jest.fn()}
        },
      })
      const {getByLabelText} = render(null, {wrapper})

      const closeButton = getByLabelText('Dismiss announcements')
      fireEvent.click(closeButton)
      expect(saveSeenAnnouncementsMock).toHaveBeenCalledWith(mockAnnouncements.map((d) => d._id))
    })
    test("when the card is dismissed, doesn't persist previous stored values", () => {
      const {createClient} = require('@sanity/client')
      const saveSeenAnnouncementsMock = jest.fn()
      // The id received here is not present anymore in the mock announcements, this id won't be stored in next save.
      seenAnnouncementsMock.mockReturnValue([['not-to-be-persisted'], saveSeenAnnouncementsMock])

      const mockFetch = createClient().observable.fetch as jest.Mock
      mockFetch.mockReturnValue({
        subscribe: ({next}: any) => {
          next(mockAnnouncements)
          return {unsubscribe: jest.fn()}
        },
      })
      const {getByLabelText} = render(null, {wrapper})

      const closeButton = getByLabelText('Dismiss announcements')
      fireEvent.click(closeButton)
      expect(saveSeenAnnouncementsMock).toHaveBeenCalledWith(mockAnnouncements.map((d) => d._id))
    })
    test('when the card is dismissed, persist previous stored values', () => {
      const {createClient} = require('@sanity/client')
      const saveSeenAnnouncementsMock = jest.fn()
      // The id received here is present in the mock announcements, this id will be persisted in next save.
      seenAnnouncementsMock.mockReturnValue([[mockAnnouncements[0]._id], saveSeenAnnouncementsMock])

      const mockFetch = createClient().observable.fetch as jest.Mock
      mockFetch.mockReturnValue({
        subscribe: ({next}: any) => {
          next(mockAnnouncements)
          return {unsubscribe: jest.fn()}
        },
      })
      const {getByLabelText} = render(null, {wrapper})

      const closeButton = getByLabelText('Dismiss announcements')
      fireEvent.click(closeButton)
      expect(saveSeenAnnouncementsMock).toHaveBeenCalledWith(mockAnnouncements.map((d) => d._id))
    })
    test('when the dialog is closed', () => {
      const {createClient} = require('@sanity/client')
      const saveSeenAnnouncementsMock = jest.fn()
      // The id received here is present in the mock announcements, this id will be persisted in next save.
      seenAnnouncementsMock.mockReturnValue([[], saveSeenAnnouncementsMock])

      const mockFetch = createClient().observable.fetch as jest.Mock
      mockFetch.mockReturnValue({
        subscribe: ({next}: any) => {
          next(mockAnnouncements)
          return {unsubscribe: jest.fn()}
        },
      })
      const {getByLabelText} = render(null, {wrapper})

      const openButton = getByLabelText('Open announcements')
      fireEvent.click(openButton)
      // Dialog renders and we close it
      const closeButton = getByLabelText('Close dialog')
      fireEvent.click(closeButton)
      expect(saveSeenAnnouncementsMock).toHaveBeenCalledWith(mockAnnouncements.map((d) => d._id))
    })
  })
})
