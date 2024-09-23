/* eslint-disable camelcase */
import {afterEach, describe, expect, jest, test} from '@jest/globals'
import {Menu} from '@sanity/ui'
import {fireEvent, render, screen} from '@testing-library/react'
import {type ReactNode} from 'react'
import {defineConfig} from 'sanity'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
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

jest.mock('@sanity/telemetry/react', () => ({
  useTelemetry: jest.fn().mockReturnValue({
    log: jest.fn(),
  }),
}))

jest.mock('../../../version', () => ({
  SANITY_VERSION: '3.57.0',
}))

const announcementCardProps = {
  title: 'New Features Available',
  id: 'foo',
  preHeader: "What's new",
} as const

describe('StudioAnnouncementsCard', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })
  test('renders correctly when isOpen is true', async () => {
    const onCardClickMock = jest.fn()
    const onCardDismissMock = jest.fn()

    const mockLog = jest.fn()
    const {useTelemetry} = require('@sanity/telemetry/react')
    useTelemetry.mockReturnValue({log: mockLog})

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
      source: 'studio',
      studio_version: '3.57.0',
    })
    expect(screen.getByText("What's new")).toBeInTheDocument()
    expect(screen.getByText(announcementCardProps.title)).toBeInTheDocument()
  })
  test('renders a different preHeader', async () => {
    const onCardClickMock = jest.fn()
    const onCardDismissMock = jest.fn()

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
    const onCardClickMock = jest.fn()
    const onCardDismissMock = jest.fn()

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
    const onCardClickMock = jest.fn()
    const onCardDismissMock = jest.fn()

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
    const onCardClickMock = jest.fn()
    const onCardDismissMock = jest.fn()

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
