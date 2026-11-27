import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, userEvent, waitFor, within} from 'storybook/test'

import {DocumentNavigationMenuStory} from './DocumentNavigationMenuStory'

/**
 * Reuses the in-package harness: the document-panel navigation picker menu
 * with its filter field and section headers. Play opens the portaled menu.
 */
const meta = {
  title: 'Structure/Document Panel Navigation/Document Navigation Menu',
  component: DocumentNavigationMenuStory,
} satisfies Meta<typeof DocumentNavigationMenuStory>

export default meta
type Story = StoryObj<typeof meta>

async function openMenu(canvasElement: HTMLElement) {
  const canvas = within(canvasElement)
  // TestWrapper resolves its mock workspace asynchronously, so the trigger
  // is not in the canvas on the first frame.
  const trigger = await canvas.findByTestId('document-navigation-menu-trigger', undefined, {
    timeout: 5000,
  })
  await userEvent.click(trigger)
  const body = within(document.body)
  await waitFor(() => expect(body.getByTestId('document-navigation-menu')).toBeVisible(), {
    timeout: 3000,
  })
  return body
}

/** Empty filter: leading item, always-shown empty section, populated Other. */
export const Open: Story = {
  parameters: {chromatic: {delay: 300}},
  play: async ({canvasElement}) => {
    const body = await openMenu(canvasElement)
    await expect(body.getByTestId('document-navigation-menu-section-document')).toBeVisible()
    await expect(body.getByTestId('document-navigation-menu-section-other')).toBeVisible()
    await expect(body.getByTestId('item-Default')).toBeVisible()
    await expect(body.getByTestId('item-Alpha')).toBeVisible()
  },
}

/** Pre-filled filter that matches nothing: the menu's empty-filter chrome. */
export const NoMatches: Story = {
  args: {initialFilter: 'zzzz'},
  parameters: {chromatic: {delay: 300}},
  play: async ({canvasElement}) => {
    const body = await openMenu(canvasElement)
    await expect(body.getByTestId('document-navigation-menu-no-matches')).toBeVisible()
  },
}
