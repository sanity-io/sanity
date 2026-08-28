import {type Meta, type StoryObj} from '@storybook/react-vite'

import {FieldDiffChromeStory} from './FieldDiffChromeStory'

/**
 * Reuses the in-package harness: review-changes chrome (ValueError,
 * ChangesError, MetaInfo, ChangeBreadcrumb) after the ui5 Box migration.
 */
const meta = {
  title: 'Field/Diff Chrome',
  component: FieldDiffChromeStory,
} satisfies Meta<typeof FieldDiffChromeStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
