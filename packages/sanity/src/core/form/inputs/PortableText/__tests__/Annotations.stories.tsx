import {type Meta, type StoryObj} from '@storybook/react-vite'

import {AnnotationsStory} from './AnnotationsStory'

/**
 * Reuses the `Annotations.browser.test.tsx` harness: a Portable Text input
 * with a link annotation configured.
 */
const meta = {
  title: 'Portable Text/Annotations',
  component: AnnotationsStory,
  tags: ['!dev', '!autodocs', 'vrt-only'],
  parameters: {chromatic: {delay: 300}},
} satisfies Meta<typeof AnnotationsStory>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
