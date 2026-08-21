import {type Meta, type StoryObj} from '@storybook/react-vite'

import {TableBlockValidationStory} from './TableBlockValidationStory'

/**
 * Reuses the `TableBlockValidation.browser.test.tsx` harness: a `rule.custom`
 * error keyed to the table block's own path, verifying the table gets the
 * same validation chrome as other object blocks.
 */
const meta = {
  title: 'Portable Text/Table Block Validation',
  component: TableBlockValidationStory,
  parameters: {chromatic: {delay: 300}},
} satisfies Meta<typeof TableBlockValidationStory>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
