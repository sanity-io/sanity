import {type Meta, type StoryObj} from '@storybook/react-vite'

import {FormAlertsStory} from './FormAlertsStory'

/**
 * Reuses the in-package harness: form Alert / AlertStrip / Details after
 * the mixed ui5 Box and Sanity UI Flex migration. Fixture copy only.
 */
const meta = {
  title: 'Form/Alerts',
  component: FormAlertsStory,
} satisfies Meta<typeof FormAlertsStory>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
