import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, waitFor, within} from 'storybook/test'

import {CanvasDialogsStory} from './CanvasDialogsStory'

/**
 * Chromatic sentinel: the canvas link and unlink dialogs (idle confirm, and
 * the critical error cards of both). Fixture copy only; no request leaves the
 * mock studio.
 */
const meta = {
  title: 'Canvas/Dialogs',
  component: CanvasDialogsStory,
} satisfies Meta<typeof CanvasDialogsStory>

export default meta
type Story = StoryObj<typeof meta>

// TestWrapper suspends on the mock workspace and Storybook resolves render
// on the first commit, so wait for the dialog before touching focus.
// @sanity/ui Dialog then deterministically focuses its first focusable
// descendant; blur it so the snapshot is about layout, not a focus ring.
async function waitAndBlurDialog() {
  const body = within(document.body)
  await waitFor(() => expect(body.getByRole('dialog')).toBeVisible(), {timeout: 5000})
  await waitFor(() => expect(document.activeElement).not.toBe(document.body))
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
}

// The error cards fade (and scale) in through motion; wait until the
// transition has landed so the archive shows the settled card.
async function waitForSettledErrorCard() {
  await waitAndBlurDialog()
  await waitFor(
    async () => {
      const card = document.querySelector<HTMLElement>('[data-ui="Card"][data-tone="critical"]')
      await expect(card).not.toBeNull()
      const wrapper = card!.parentElement!
      await expect(getComputedStyle(wrapper).opacity).toBe('1')
      await expect(['none', 'matrix(1, 0, 0, 1, 0, 0)']).toContain(
        getComputedStyle(wrapper).transform,
      )
    },
    {timeout: 5000},
  )
}

export const UnlinkIdle: Story = {
  args: {mode: 'unlink-idle'},
  play: waitAndBlurDialog,
}

export const UnlinkError: Story = {
  args: {mode: 'unlink-error'},
  play: waitForSettledErrorCard,
}

export const LinkMissingDocumentId: Story = {
  args: {mode: 'link-missing-document-id'},
  play: waitForSettledErrorCard,
}

export const LinkStudioAppNotFound: Story = {
  args: {mode: 'link-app-not-found'},
  play: waitForSettledErrorCard,
}
