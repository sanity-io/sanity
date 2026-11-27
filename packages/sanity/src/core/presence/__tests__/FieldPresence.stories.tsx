import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, userEvent, waitFor, within} from 'storybook/test'

import {FieldPresenceStory} from './FieldPresenceStory'

/**
 * Chromatic sentinel: stacked field-header presence avatars (one, three,
 * overflow counter) and the open presence tooltip of names after the ui5
 * Text / Flex migration. Fixture users only.
 */
const meta = {
  title: 'Studio/Field Presence',
  component: FieldPresenceStory,
} satisfies Meta<typeof FieldPresenceStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  args: {mode: 'states'},
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    await waitFor(() => expect(canvas.getByText('five with counter')).toBeVisible(), {
      timeout: 5000,
    })
  },
}

/**
 * Hover the trigger so Chromatic archives the open tooltip: each present
 * user as an avatar plus display name, portaled to the document scroll
 * element the field header uses.
 */
export const OpenTooltip: Story = {
  args: {mode: 'tooltip'},
  parameters: {chromatic: {delay: 300}},
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    await userEvent.hover(await canvas.findByRole('button', {name: 'Who is here'}, {timeout: 5000}))
    const body = within(document.body)
    await waitFor(() => expect(body.getByText('Ada Lovelace')).toBeVisible(), {timeout: 3000})
  },
}
