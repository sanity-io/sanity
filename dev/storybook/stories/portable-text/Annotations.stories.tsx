import {type Meta, type StoryObj} from '@storybook/react-vite'

import {AnnotationsStory} from '../../../../packages/sanity/src/core/form/inputs/PortableText/__tests__/AnnotationsStory'

/**
 * Reuses the `Annotations.browser.test.tsx` harness: a Portable Text input
 * with a link annotation configured.
 */
const meta = {
  title: 'Portable Text/Annotations',
  component: AnnotationsStory,
  parameters: {chromatic: {delay: 300}},
} satisfies Meta<typeof AnnotationsStory>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
