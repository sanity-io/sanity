import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, waitFor, within} from 'storybook/test'

import {DocumentPaneChromeStory} from './DocumentPaneChromeStory'

/**
 * Chromatic sentinel for the document pane's leaf chrome ahead of its
 * styled-components and `ui5` migrations: form headers, timeline items with
 * their styled wrappers, the document status pulse, the JSON inspector
 * wrapper and search, the confirm-delete table primitives, a popover dialog,
 * the unknown-document-type error pane and the inspector error boundary.
 */
const meta = {
  title: 'Structure/Document Pane Chrome',
  component: DocumentPaneChromeStory,
} satisfies Meta<typeof DocumentPaneChromeStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  play: async () => {
    const body = within(document.body)
    await waitFor(() => expect(body.getByText('Untitled')).toBeVisible(), {timeout: 5000})
    await expect(body.getByText('Edited')).toBeVisible()
    await expect(body.getByText('Published')).toBeVisible()
    await expect(body.getByText('Saved')).toBeVisible()
    await expect(body.getByText('Saving...')).toBeVisible()
    await expect(body.getByPlaceholderText('Search')).toBeVisible()
    await expect(body.getByText('3 other references not shown')).toBeVisible()
    // The popover is positioned once its anchor's callback ref has committed
    await waitFor(() => expect(body.getByText('Popover dialog content')).toBeVisible(), {
      timeout: 5000,
    })
    await expect(body.getByText('which is not defined as a type', {exact: false})).toBeVisible()
    await expect(body.getByText('The inspector failed on purpose')).toBeVisible()
  },
}
