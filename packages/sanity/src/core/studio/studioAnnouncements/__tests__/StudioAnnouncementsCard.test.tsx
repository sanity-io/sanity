import {afterEach, describe, expect, jest, test} from '@jest/globals'
import {Menu} from '@sanity/ui'
import {fireEvent, render, screen} from '@testing-library/react'
import {type ReactNode} from 'react'
import {defineConfig} from 'sanity'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
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

describe('StudioAnnouncementsCard', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })
  test('renders correctly when isOpen is true', async () => {
    const onCardClickMock = jest.fn()
    const onCardDismissMock = jest.fn()
    const announcementType = 'whats-new'
    const title = 'New Features Available'

    const wrapper = await createAnnouncementWrapper()
    render(
      <StudioAnnouncementsCard
        isOpen
        title={title}
        announcementType={announcementType}
        onCardClick={onCardClickMock}
        onCardDismiss={onCardDismissMock}
      />,
      {wrapper},
    )

    expect(screen.getByText("What's new")).toBeInTheDocument()
    expect(screen.getByText(title)).toBeInTheDocument()
  })
  test('does not render when isOpen is false', async () => {
    const onCardClickMock = jest.fn()
    const onCardDismissMock = jest.fn()
    const announcementType = 'whats-new'
    const title = 'New Features Available'

    const wrapper = await createAnnouncementWrapper()

    const {queryByText} = render(
      <StudioAnnouncementsCard
        title={title}
        isOpen={false}
        announcementType={announcementType}
        onCardClick={onCardClickMock}
        onCardDismiss={onCardDismissMock}
      />,
      {wrapper},
    )

    expect(queryByText("What's new")).toBeNull()
    expect(queryByText(title)).toBeNull()
  })
  test('calls onCardClick when the card is clicked', async () => {
    const onCardClickMock = jest.fn()
    const onCardDismissMock = jest.fn()
    const announcementType = 'whats-new'
    const title = 'New Features Available'

    const wrapper = await createAnnouncementWrapper()

    render(
      <StudioAnnouncementsCard
        isOpen
        title={title}
        announcementType={announcementType}
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
    const announcementType = 'whats-new'
    const title = 'New Features Available'

    const wrapper = await createAnnouncementWrapper()
    render(
      <StudioAnnouncementsCard
        isOpen
        title={title}
        announcementType={announcementType}
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
