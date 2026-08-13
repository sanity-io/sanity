import {type Meta, type StoryObj} from '@storybook/react-vite'

import FocusTrackingStory from '../../../../packages/sanity/src/core/form/inputs/PortableText/__tests__/FocusTrackingStory'

/**
 * Reuses the `FocusTracking.browser.test.tsx` harness: a document with
 * Portable Text fields whose focus path can be controlled from the outside.
 */
const meta = {
  title: 'Portable Text/Focus Tracking',
  component: FocusTrackingStory,
  parameters: {chromatic: {delay: 300}},
} satisfies Meta<typeof FocusTrackingStory>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
