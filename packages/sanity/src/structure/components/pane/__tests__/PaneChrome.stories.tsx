import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, userEvent, waitFor, within} from 'storybook/test'

import {PaneChromeStory} from './PaneChromeStory'

/**
 * Chromatic sentinel: structure pane chrome ahead of the ui5 Flex migration
 * (pane layout, headers with actions and tabs, pane item previews). Fixture
 * documents only.
 */
const meta = {
  title: 'Structure/Pane Chrome',
  component: PaneChromeStory,
  tags: ['!dev', '!autodocs', 'vrt-only'],
} satisfies Meta<typeof PaneChromeStory>

export default meta
type Story = StoryObj<typeof meta>

export const Expanded: Story = {}

/**
 * Clicking a non-last pane's title collapses it: the header rotates into a
 * vertical strip and the pane shrinks to its collapsed width.
 */
export const Collapsed: Story = {
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    const title = await canvas.findByText(/Authors, contributors and editors/, {}, {timeout: 5000})
    const pane = title.closest('[data-testid="pane"]')
    await userEvent.click(title)
    await waitFor(() => expect(pane).toHaveAttribute('data-pane-collapsed'))
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
  },
}
