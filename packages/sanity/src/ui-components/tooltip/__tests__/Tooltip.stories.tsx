import {Flex} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, userEvent, waitFor, within} from 'storybook/test'

import {Button} from '../../button/Button'
import {Tooltip} from '../Tooltip'

/**
 * The studio's `ui-components` wrapper around the `@sanity/ui` Tooltip. It
 * removes the `arrow`/`padding`/`shadow` options and applies shared defaults:
 * a 400ms open delay, `placement="bottom"` with corner fallbacks, animation
 * and a portal. A `string` `content` is wrapped in `Text size={1}` and padded;
 * strings are strongly preferred over ReactNode content to keep i18n simple.
 * Each story hovers its trigger in `play` so the open tooltip is what gets
 * snapshotted.
 */
const meta = {
  title: 'UI Components/Tooltip',
  component: Tooltip,
  parameters: {chromatic: {delay: 300}},
} satisfies Meta<typeof Tooltip>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Flex align="center" justify="center" style={{minHeight: 160}}>
      <Tooltip content="Publish this document" portal>
        <Button mode="ghost" text="Hover me" />
      </Tooltip>
    </Flex>
  ),
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    await userEvent.hover(canvas.getByRole('button', {name: 'Hover me'}))
    // The tooltip portals to document.body and opens after the shared 400ms delay
    const body = within(document.body)
    await waitFor(() => expect(body.getByText('Publish this document')).toBeVisible(), {
      timeout: 3000,
    })
  },
}

/**
 * A `hotkeys` array renders a keyboard hint inline beside the label, the
 * pattern used across studio action buttons.
 */
export const WithHotkeys: Story = {
  render: () => (
    <Flex align="center" justify="center" style={{minHeight: 160}}>
      <Tooltip content="Search" hotkeys={['Ctrl', 'K']} portal>
        <Button mode="ghost" text="Hover me" />
      </Tooltip>
    </Flex>
  ),
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    await userEvent.hover(canvas.getByRole('button', {name: 'Hover me'}))
    const body = within(document.body)
    await waitFor(() => expect(body.getByText('Search')).toBeVisible(), {timeout: 3000})
  },
}
