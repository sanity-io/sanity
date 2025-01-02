/* eslint-disable camelcase */
import {fireEvent, render, renderHook, waitFor} from '@testing-library/react'
import {type ReactNode} from 'react'
import {of} from 'rxjs'
import {beforeAll, beforeEach, describe, expect, test, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {defineConfig} from '../../../config/defineConfig'
import {type Config} from '../../../config/types'
import {useClient} from '../../../hooks/useClient'
import {
  ProductAnnouncementCardClicked,
  ProductAnnouncementCardDismissed,
  ProductAnnouncementCardSeen,
  ProductAnnouncementModalDismissed,
  ProductAnnouncementViewed,
} from '../__telemetry__/studioAnnouncements.telemetry'
import {StudioAnnouncementsProvider} from '../StudioAnnouncementsProvider'
import {type StudioAnnouncementDocument} from '../types'
import {useSeenAnnouncements} from '../useSeenAnnouncements'
import {useStudioAnnouncements} from '../useStudioAnnouncements'

vi.mock('@sanity/telemetry/react', () => ({
  useTelemetry: vi.fn().mockReturnValue({
    log: vi.fn(),
  }),
}))

vi.mock('@sanity/client', () => ({
  createClient: vi.fn().mockReturnValue({
    observable: {
      fetch: vi.fn(),
    },
  }),
}))

vi.mock('../../../hooks/useClient')
const useClientMock = useClient as ReturnType<typeof vi.fn>

const mockObservableRequest = vi.fn((announcements) => of(announcements))
const mockClient = (announcements: StudioAnnouncementDocument[]) => {
  useClientMock.mockReturnValue({
    observable: {
      request: () => mockObservableRequest(announcements),
    },
  })
}

vi.mock('../useSeenAnnouncements')
const seenAnnouncementsMock = useSeenAnnouncements as ReturnType<typeof vi.fn>

vi.mock('../../../version', () => ({
  SANITY_VERSION: '3.57.0',
}))

const config = defineConfig({
  projectId: 'test',
  dataset: 'test',
})
async function createAnnouncementWrapper(configOverride: Partial<Config> = {}) {
  const wrapper = await createTestProvider({
    config: {
      ...config,
      ...configOverride,
    },
    resources: [],
  })

  return ({children}: {children: ReactNode}) =>
    wrapper({children: <StudioAnnouncementsProvider>{children}</StudioAnnouncementsProvider>})
}

const mockAnnouncements: StudioAnnouncementDocument[] = [
  {
    _id: 'studioAnnouncement-1',
    _type: 'productAnnouncement',
    _rev: '1',
    _createdAt: '2024-09-10T14:44:00.000Z',
    _updatedAt: "2024-09-10T14:44:00.000Z'",
    title: 'Announcement 1',
    body: [],
    announcementType: 'whats-new',
    preHeader: "What's new",
    publishedDate: '2024-09-10T14:44:00.000Z',
    audience: 'everyone',
    name: 'announcement-1',
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
    preHeader: "What's new",
    publishedDate: '2024-09-10T14:44:00.000Z',
    audience: 'everyone',
    name: 'announcement-2',
  },
]

describe('StudioAnnouncementsProvider', () => {
  let wrapper = ({children}: {children: ReactNode}) => children
  beforeAll(async () => {
    wrapper = await createAnnouncementWrapper()
  })
  describe('if seen announcements is loading', () => {
    beforeEach(() => {
      vi.clearAllMocks()
      seenAnnouncementsMock.mockReturnValue([
        of({loading: true, value: null, error: null}),
        vi.fn(),
      ])
      mockClient(mockAnnouncements)
    })
    test('returns empty unseen announcements ', () => {
      const {result} = renderHook(() => useStudioAnnouncements(), {
        wrapper,
      })
      expect(seenAnnouncementsMock).toBeCalled()
      expect(mockObservableRequest).toBeCalled()
      expect(result.current.unseenAnnouncements).toEqual([])
      expect(result.current.studioAnnouncements).toEqual(mockAnnouncements)
    })
    test("if unseen is empty, card doesn't show ", () => {
      const {queryByText} = render(null, {wrapper})
      expect(queryByText("What's new")).toBeNull()
    })
  })
  describe('if seen announcements failed', () => {
    beforeEach(() => {
      vi.clearAllMocks()
      seenAnnouncementsMock.mockReturnValue([
        of({loading: false, value: null, error: new Error('something went wrong')}),
        vi.fn(),
      ])
      mockClient(mockAnnouncements)
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
      vi.clearAllMocks()
      seenAnnouncementsMock.mockReturnValue([of({value: [], error: null, loading: false}), vi.fn()])
      mockClient(mockAnnouncements)
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
      vi.clearAllMocks()
      // It doesn't show the first element
      seenAnnouncementsMock.mockReturnValue([
        of({value: ['studioAnnouncement-1'], error: null, loading: false}),
        vi.fn(),
      ])

      mockClient(mockAnnouncements)
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
      vi.clearAllMocks()
      // It doesn't show the first element
      seenAnnouncementsMock.mockReturnValue([
        of({value: ['studioAnnouncement-1'], error: null, loading: false}),
        vi.fn(),
      ])

      mockClient(mockAnnouncements)
    })
    test('clicks on card, it opens dialog and card is hidden, shows only the unseen announcements', async () => {
      const mockLog = vi.fn()
      const {useTelemetry} = await import('@sanity/telemetry/react')
      ;(useTelemetry as ReturnType<typeof vi.fn>).mockReturnValue({log: mockLog})

      const {queryByText, getByLabelText} = render(null, {wrapper})

      expect(queryByText("What's new")).toBeInTheDocument()
      expect(queryByText(mockAnnouncements[1].title)).toBeInTheDocument()
      const cardButton = getByLabelText('Open announcements')
      fireEvent.click(cardButton)

      await waitFor(() => {
        expect(queryByText("What's new")).toBeNull()
      })
      // The first announcement is seen, so it's not rendered
      expect(queryByText(mockAnnouncements[0].title)).toBeNull()
      // The second announcement is unseen, so it's rendered
      expect(queryByText(mockAnnouncements[1].title)).toBeInTheDocument()

      // Opening the dialog calls the telemetry only once, with the seen card
      expect(mockLog).toBeCalledTimes(3)
      expect(mockLog).toBeCalledWith(ProductAnnouncementCardSeen, {
        announcement_id: 'studioAnnouncement-2',
        announcement_title: 'Announcement 2',
        announcement_internal_name: 'announcement-2',
        source: 'studio',
        studio_version: '3.57.0',
      })
      expect(mockLog).toBeCalledWith(ProductAnnouncementCardClicked, {
        announcement_id: 'studioAnnouncement-2',
        announcement_title: 'Announcement 2',
        announcement_internal_name: 'announcement-2',
        source: 'studio',
        studio_version: '3.57.0',
      })
      expect(mockLog).toBeCalledWith(ProductAnnouncementViewed, {
        announcement_id: 'studioAnnouncement-2',
        announcement_title: 'Announcement 2',
        announcement_internal_name: 'announcement-2',
        origin: 'card',
        scrolled_into_view: false,
        source: 'studio',
        studio_version: '3.57.0',
      })
    })

    test("dismisses card, then it's hidden, dialog doesn't render", async () => {
      const mockLog = vi.fn()
      const {useTelemetry} = await import('@sanity/telemetry/react')
      ;(useTelemetry as ReturnType<typeof vi.fn>).mockReturnValue({log: mockLog})

      const {queryByText, getByLabelText} = render(null, {wrapper})

      expect(queryByText("What's new")).toBeInTheDocument()
      expect(queryByText(mockAnnouncements[1].title)).toBeInTheDocument()
      const closeButton = getByLabelText('Dismiss announcements')
      fireEvent.click(closeButton)
      await waitFor(() => {
        expect(queryByText("What's new")).toBeNull()
      })
      expect(queryByText(mockAnnouncements[1].title)).toBeNull()

      // Dismissing the card calls telemetry with the seen and dismiss logs
      expect(mockLog).toBeCalledTimes(2)
      expect(mockLog).toBeCalledWith(ProductAnnouncementCardSeen, {
        announcement_id: 'studioAnnouncement-2',
        announcement_title: 'Announcement 2',
        announcement_internal_name: 'announcement-2',
        source: 'studio',
        studio_version: '3.57.0',
      })
      expect(mockLog).toBeCalledWith(ProductAnnouncementCardDismissed, {
        announcement_id: 'studioAnnouncement-2',
        announcement_title: 'Announcement 2',
        announcement_internal_name: 'announcement-2',
        source: 'studio',
        studio_version: '3.57.0',
      })
    })

    test('dismisses dialog, card and dialog are hidden', async () => {
      const mockLog = vi.fn()
      const {useTelemetry} = await import('@sanity/telemetry/react')
      ;(useTelemetry as ReturnType<typeof vi.fn>).mockReturnValue({log: mockLog})

      const {queryByText, getByLabelText} = render(null, {wrapper})

      expect(queryByText("What's new")).toBeInTheDocument()
      expect(queryByText(mockAnnouncements[1].title)).toBeInTheDocument()
      const cardButton = getByLabelText('Open announcements')
      fireEvent.click(cardButton)
      await waitFor(() => {
        expect(queryByText("What's new")).toBeNull()
      })
      expect(queryByText(mockAnnouncements[1].title)).toBeInTheDocument()

      const closeButton = getByLabelText('Close dialog')
      fireEvent.click(closeButton)
      expect(queryByText("What's new")).toBeNull()
      expect(queryByText(mockAnnouncements[1].title)).toBeNull()

      expect(mockLog).toBeCalledTimes(4)
      expect(mockLog).toBeCalledWith(ProductAnnouncementCardSeen, {
        announcement_id: 'studioAnnouncement-2',
        announcement_title: 'Announcement 2',
        announcement_internal_name: 'announcement-2',
        source: 'studio',
        studio_version: '3.57.0',
      })
      expect(mockLog).toBeCalledWith(ProductAnnouncementCardClicked, {
        announcement_id: 'studioAnnouncement-2',
        announcement_title: 'Announcement 2',
        announcement_internal_name: 'announcement-2',
        source: 'studio',
        studio_version: '3.57.0',
      })
      expect(mockLog).toBeCalledWith(ProductAnnouncementModalDismissed, {
        announcement_id: 'studioAnnouncement-2',
        announcement_title: 'Announcement 2',
        announcement_internal_name: 'announcement-2',
        origin: 'card',
        source: 'studio',
        studio_version: '3.57.0',
      })
      expect(mockLog).toBeCalledWith(ProductAnnouncementViewed, {
        announcement_id: 'studioAnnouncement-2',
        announcement_title: 'Announcement 2',
        announcement_internal_name: 'announcement-2',
        origin: 'card',
        scrolled_into_view: false,
        source: 'studio',
        studio_version: '3.57.0',
      })
    })
    test('opens the dialog from outside the card, so it shows all unseen', async () => {
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
      await waitFor(() => {
        expect(queryByText("What's new")).toBeNull()
      })
      // The first announcement is seen, it's rendered because it's showing all
      expect(queryByText(mockAnnouncements[0].title)).toBeInTheDocument()
      // The second announcement is unseen, so it's rendered
      expect(queryByText(mockAnnouncements[1].title)).toBeInTheDocument()
    })
  })
  describe('tests audiences - studio version is 3.57.0', () => {
    beforeEach(() => {
      vi.clearAllMocks()
      // It doesn't show the first element
      seenAnnouncementsMock.mockReturnValue([of({value: [], error: null, loading: false}), vi.fn()])
    })

    test('if the audience is everyone, it shows the announcement regardless the version', () => {
      const announcements: StudioAnnouncementDocument[] = [
        {
          ...mockAnnouncements[1],
          audience: 'everyone',
        },
      ]
      mockClient(announcements)

      const {result} = renderHook(() => useStudioAnnouncements(), {
        wrapper,
      })

      expect(result.current.unseenAnnouncements).toEqual(announcements)
      expect(result.current.studioAnnouncements).toEqual(announcements)
    })
    test('if the audience is greater-than-or-equal-version and studio version is not above', () => {
      const announcements: StudioAnnouncementDocument[] = [
        {
          ...mockAnnouncements[1],
          audience: 'greater-than-or-equal-version',
          studioVersion: '3.58.0',
        },
      ]
      mockClient(announcements)

      const {result} = renderHook(() => useStudioAnnouncements(), {
        wrapper,
      })

      expect(result.current.unseenAnnouncements).toEqual([])
      expect(result.current.studioAnnouncements).toEqual([])
    })
    test('if the audience is greater-than-or-equal-version and studio version is above', () => {
      const announcements: StudioAnnouncementDocument[] = [
        {
          ...mockAnnouncements[1],
          audience: 'greater-than-or-equal-version',
          studioVersion: '3.56.0',
        },
      ]
      mockClient(announcements)

      const {result} = renderHook(() => useStudioAnnouncements(), {
        wrapper,
      })

      expect(result.current.unseenAnnouncements).toEqual(announcements)
      expect(result.current.studioAnnouncements).toEqual(announcements)
    })
    test('if the audience is above-equal.version and studio version is equal', () => {
      const announcements: StudioAnnouncementDocument[] = [
        {
          ...mockAnnouncements[1],
          audience: 'greater-than-or-equal-version',
          studioVersion: '3.57.0',
        },
      ]
      mockClient(announcements)

      const {result} = renderHook(() => useStudioAnnouncements(), {
        wrapper,
      })

      expect(result.current.unseenAnnouncements).toEqual(announcements)
      expect(result.current.studioAnnouncements).toEqual(announcements)
    })
    test('if the audience is specific-version and studio matches', () => {
      const announcements: StudioAnnouncementDocument[] = [
        {
          ...mockAnnouncements[1],
          audience: 'specific-version',
          studioVersion: '3.57.0',
        },
      ]
      mockClient(announcements)

      const {result} = renderHook(() => useStudioAnnouncements(), {
        wrapper,
      })

      expect(result.current.unseenAnnouncements).toEqual(announcements)
      expect(result.current.studioAnnouncements).toEqual(announcements)
    })
    test("if the audience is specific-version and studio doesn't match ", () => {
      const announcements: StudioAnnouncementDocument[] = [
        {
          ...mockAnnouncements[1],
          audience: 'specific-version',
          studioVersion: '3.56.0',
        },
      ]
      mockClient(announcements)

      const {result} = renderHook(() => useStudioAnnouncements(), {
        wrapper,
      })

      expect(result.current.unseenAnnouncements).toEqual([])
      expect(result.current.studioAnnouncements).toEqual([])
    })
    test('if the audience is less-than-or-equal-version and studio is above', () => {
      const announcements: StudioAnnouncementDocument[] = [
        {
          ...mockAnnouncements[1],
          audience: 'less-than-or-equal-version',
          studioVersion: '3.56.0',
        },
      ]
      mockClient(announcements)

      const {result} = renderHook(() => useStudioAnnouncements(), {
        wrapper,
      })

      expect(result.current.unseenAnnouncements).toEqual([])
      expect(result.current.studioAnnouncements).toEqual([])
    })
    test('if the audience is less-than-or-equal-version and studio is below', () => {
      const announcements: StudioAnnouncementDocument[] = [
        {
          ...mockAnnouncements[1],
          audience: 'less-than-or-equal-version',
          studioVersion: '3.58.0',
        },
      ]
      mockClient(announcements)

      const {result} = renderHook(() => useStudioAnnouncements(), {
        wrapper,
      })

      expect(result.current.unseenAnnouncements).toEqual(announcements)
      expect(result.current.studioAnnouncements).toEqual(announcements)
    })
    test('if the audience is less-than-or-equal-version and studio is equal', () => {
      const announcements: StudioAnnouncementDocument[] = [
        {
          ...mockAnnouncements[1],
          audience: 'less-than-or-equal-version',
          studioVersion: '3.57.0',
        },
      ]
      mockClient(announcements)

      const {result} = renderHook(() => useStudioAnnouncements(), {
        wrapper,
      })

      expect(result.current.unseenAnnouncements).toEqual(announcements)
      expect(result.current.studioAnnouncements).toEqual(announcements)
    })
    test("if the audienceRole is fixed and user doesn't have the role", () => {
      // mocked workspace roles is  [ { name: 'administrator', title: 'Administrator' } ]
      const announcements: StudioAnnouncementDocument[] = [
        {
          ...mockAnnouncements[1],
          audienceRole: ['developer'],
          audience: 'everyone',
        },
      ]
      mockClient(announcements)

      const {result} = renderHook(() => useStudioAnnouncements(), {
        wrapper,
      })

      expect(result.current.unseenAnnouncements).toEqual([])
      expect(result.current.studioAnnouncements).toEqual([])
    })
    test('if the audienceRole is fixed and user has the role', () => {
      // mocked workspace roles is  [ { name: 'administrator', title: 'Administrator' } ]
      const announcements: StudioAnnouncementDocument[] = [
        {
          ...mockAnnouncements[1],
          audienceRole: ['administrator'],
          audience: 'everyone',
        },
      ]
      mockClient(announcements)

      const {result} = renderHook(() => useStudioAnnouncements(), {
        wrapper,
      })

      expect(result.current.unseenAnnouncements).toEqual(announcements)
      expect(result.current.studioAnnouncements).toEqual(announcements)
    })
  })
  describe('storing seen announcements', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })
    test('when the card is dismissed, and only 1 announcement received', () => {
      const saveSeenAnnouncementsMock = vi.fn()
      seenAnnouncementsMock.mockReturnValue([
        of({value: [], error: null, loading: false}),
        saveSeenAnnouncementsMock,
      ])
      mockClient([mockAnnouncements[0]])

      const {getByLabelText} = render(null, {wrapper})

      const closeButton = getByLabelText('Dismiss announcements')
      fireEvent.click(closeButton)
      expect(saveSeenAnnouncementsMock).toHaveBeenCalledWith([mockAnnouncements[0]._id])
    })
    test('when the card is dismissed, and 2 announcements are received', () => {
      const saveSeenAnnouncementsMock = vi.fn()
      seenAnnouncementsMock.mockReturnValue([
        of({value: [], error: null, loading: false}),
        saveSeenAnnouncementsMock,
      ])
      mockClient(mockAnnouncements)

      const {getByLabelText} = render(null, {wrapper})

      const closeButton = getByLabelText('Dismiss announcements')
      fireEvent.click(closeButton)
      expect(saveSeenAnnouncementsMock).toHaveBeenCalledWith(mockAnnouncements.map((d) => d._id))
    })
    test("when the card is dismissed, doesn't persist previous stored values", () => {
      const saveSeenAnnouncementsMock = vi.fn()
      // The id received here is not present anymore in the mock announcements, this id won't be stored in next save.
      seenAnnouncementsMock.mockReturnValue([
        of({value: ['not-to-be-persisted'], error: null, loading: false}),
        saveSeenAnnouncementsMock,
      ])
      mockClient(mockAnnouncements)
      const {getByLabelText} = render(null, {wrapper})

      const closeButton = getByLabelText('Dismiss announcements')
      fireEvent.click(closeButton)
      expect(saveSeenAnnouncementsMock).toHaveBeenCalledWith(mockAnnouncements.map((d) => d._id))
    })
    test('when the card is dismissed, persist previous stored values', () => {
      const saveSeenAnnouncementsMock = vi.fn()
      // The id received here is present in the mock announcements, this id will be persisted in next save.
      seenAnnouncementsMock.mockReturnValue([
        of({value: [mockAnnouncements[0]._id], error: null, loading: false}),
        saveSeenAnnouncementsMock,
      ])
      mockClient(mockAnnouncements)

      const {getByLabelText} = render(null, {wrapper})

      const closeButton = getByLabelText('Dismiss announcements')
      fireEvent.click(closeButton)
      expect(saveSeenAnnouncementsMock).toHaveBeenCalledWith(mockAnnouncements.map((d) => d._id))
    })
    test('when the dialog is closed', () => {
      const saveSeenAnnouncementsMock = vi.fn()
      seenAnnouncementsMock.mockReturnValue([
        of({value: [], error: null, loading: false}),
        saveSeenAnnouncementsMock,
      ])
      mockClient(mockAnnouncements)

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

describe('StudioAnnouncementsProvider-Disabled', () => {
  let wrapper = ({children}: {children: ReactNode}) => children
  beforeAll(async () => {
    // Reset all mocks
    vi.clearAllMocks()
    wrapper = await createAnnouncementWrapper({
      announcements: {enabled: false},
    })
  })
  test('if the feature is disabled, the client should not be called', () => {
    const {result} = renderHook(() => useStudioAnnouncements(), {
      wrapper,
    })

    expect(result.current.unseenAnnouncements).toEqual([])
    expect(result.current.studioAnnouncements).toEqual([])
    expect(seenAnnouncementsMock).not.toBeCalled()
    expect(mockObservableRequest).not.toBeCalled()
  })
})
