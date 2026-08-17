import {type Meta, type StoryObj} from '@storybook/react-vite'

import {ConfirmPopoverStory} from '../../../../packages/sanity/src/ui-components/confirmPopover/__tests__/ConfirmPopoverStory'

/**
 * The studio's inline confirmation popover. Footer buttons inherit card/button
 * tones, so a ui5 migration can change both layout (portal placement, min
 * width) and the critical/caution confirm treatment without a type error.
 * The harness wraps `TestWrapper` because cancel/confirm labels resolve
 * through studio i18n.
 */
const meta = {
  title: 'UI Components/Confirm Popover',
  component: ConfirmPopoverStory,
  parameters: {chromatic: {delay: 300}},
} satisfies Meta<typeof ConfirmPopoverStory>

export default meta
type Story = StoryObj<typeof meta>

export const Tones: Story = {}
