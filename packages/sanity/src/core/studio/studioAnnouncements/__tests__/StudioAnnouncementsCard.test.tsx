/* eslint-disable camelcase */
import {Menu} from '@sanity/ui'
import {fireEvent, render, screen} from '@testing-library/react'
import {type ReactNode} from 'react'
import {afterEach, describe, expect, test, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {defineConfig} from '../../../config/defineConfig'
import {ProductAnnouncementCardSeen} from '../__telemetry__/studioAnnouncements.telemetry'
import {StudioAnnouncementsCard} from '../StudioAnnouncementsCard'

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

vi.mock('@sanity/telemetry/react', () => ({
  useTelemetry: vi.fn().mockReturnValue({
    log: vi.fn(),
  }),
}))

vi.mock('../../../version', () => ({
  SANITY_VERSION: '3.57.0',
}))

const announcementCardProps = {
  title: 'New Features Available',
  id: 'foo',
  preHeader: "What's new",
  name: 'new-features',
} as const

describe('StudioAnnouncementsCard', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })
  test('renders correctly when isOpen is true', async () => {
    const onCardClickMock = vi.fn()
    const onCardDismissMock = vi.fn()

    const mockLog = vi.fn()
    const {useTelemetry} = await import('@sanity/telemetry/react')
    ;(useTelemetry as ReturnType<typeof vi.fn>).mockReturnValue({log: mockLog})

    const wrapper = await createAnnouncementWrapper()
    render(
      <StudioAnnouncementsCard
        {...announcementCardProps}
        isOpen
        onCardClick={onCardClickMock}
        onCardDismiss={onCardDismissMock}
      />,
      {wrapper},
    )

    expect(mockLog).toHaveBeenCalledWith(ProductAnnouncementCardSeen, {
      announcement_id: 'foo',
      announcement_title: 'New Features Available',
      announcement_internal_name: 'new-features',
      source: 'studio',
      studio_version: '3.57.0',
    })
    expect(screen.getByText("What's new")).toBeInTheDocument()
    expect(screen.getByText(announcementCardProps.title)).toBeInTheDocument()
  })
  test('renders a different preHeader', async () => {
    const onCardClickMock = vi.fn()
    const onCardDismissMock = vi.fn()

    const preHeader = 'Check out the new features'
    const wrapper = await createAnnouncementWrapper()
    render(
      <StudioAnnouncementsCard
        {...announcementCardProps}
        preHeader={preHeader}
        isOpen
        onCardClick={onCardClickMock}
        onCardDismiss={onCardDismissMock}
      />,
      {wrapper},
    )

    expect(screen.getByText(preHeader)).toBeInTheDocument()
    expect(screen.getByText(announcementCardProps.title)).toBeInTheDocument()
  })
  test('does not render when isOpen is false', async () => {
    const onCardClickMock = vi.fn()
    const onCardDismissMock = vi.fn()

    const wrapper = await createAnnouncementWrapper()

    const {queryByText} = render(
      <StudioAnnouncementsCard
        {...announcementCardProps}
        isOpen={false}
        onCardClick={onCardClickMock}
        onCardDismiss={onCardDismissMock}
      />,
      {wrapper},
    )

    expect(queryByText("What's new")).toBeNull()
    expect(queryByText(announcementCardProps.title)).toBeNull()
  })
  test('calls onCardClick when the card is clicked', async () => {
    const onCardClickMock = vi.fn()
    const onCardDismissMock = vi.fn()

    const wrapper = await createAnnouncementWrapper()

    render(
      <StudioAnnouncementsCard
        {...announcementCardProps}
        isOpen
        onCardClick={onCardClickMock}
        onCardDismiss={onCardDismissMock}
      />,
      {wrapper},
    )

    const cardButton = screen.getByLabelText('Open announcements')
    fireEvent.click(cardButton)

    expect(onCardClickMock).toHaveBeenCalled()
  })
  test('calls onCardDismiss when the close button is clicked', async () => {
    const onCardClickMock = vi.fn()
    const onCardDismissMock = vi.fn()

    const wrapper = await createAnnouncementWrapper()
    render(
      <StudioAnnouncementsCard
        {...announcementCardProps}
        isOpen
        onCardClick={onCardClickMock}
        onCardDismiss={onCardDismissMock}
      />,
      {wrapper},
    )

    const closeButton = screen.getByLabelText('Dismiss announcements')
    fireEvent.click(closeButton)

    expect(onCardDismissMock).toHaveBeenCalled()
  })
})
