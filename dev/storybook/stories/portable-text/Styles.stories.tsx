import {type Meta, type StoryObj} from '@storybook/react-vite'

import {StylesStory} from '../../../../packages/sanity/src/core/form/inputs/PortableText/__tests__/StylesStory'

/**
 * Reuses the `Styles.browser.test.tsx` harness: a Portable Text input with
 * the default block styles (normal, headings, quote).
 */
const meta = {
  title: 'Portable Text/Styles',
  component: StylesStory,
  parameters: {chromatic: {delay: 300}},
} satisfies Meta<typeof StylesStory>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
