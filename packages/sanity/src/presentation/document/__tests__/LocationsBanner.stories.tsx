import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, userEvent, waitFor, within} from 'storybook/test'

import {LocationsBannerStory} from './LocationsBannerStory'

/**
 * The banner Presentation adds above a document's form, listing the pages
 * the document appears on. Collapsed it is a count; clicking expands the
 * location rows. Resolver messages replace the count and can carry a tone.
 */
const meta = {
  title: 'Presentation/Locations Banner',
  component: LocationsBannerStory,
} satisfies Meta<typeof LocationsBannerStory>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Every banner state side by side; `play` expands the one with locations so
 * the row list is in the snapshot. The mock studio mounts asynchronously, so
 * the toggle is awaited; the chevron rotates over 100ms, so the capture waits
 * for that transition.
 */
export const States: Story = {
  parameters: {chromatic: {delay: 300}},
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    const toggle = await canvas.findByRole('button', {name: /used on 3 pages/i}, {timeout: 5000})
    await userEvent.click(toggle)
    await waitFor(() => expect(canvas.getByText('Email client view')).toBeVisible())
  },
}
