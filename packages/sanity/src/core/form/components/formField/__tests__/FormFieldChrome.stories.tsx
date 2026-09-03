import {type Meta, type StoryObj} from '@storybook/react-vite'

import {FormFieldChromeStory} from './FormFieldChromeStory'

/**
 * Reuses the in-package harness: form field chrome (FormFieldHeaderText,
 * FormFieldSetLegend, FormFieldValidationStatus, FormFieldSet,
 * FormFieldBaseHeader) ahead of the ui5 Flex migration.
 */
const meta = {
  title: 'Form/Field Chrome',
  component: FormFieldChromeStory,
  tags: ['!dev', '!autodocs', 'vrt-only'],
} satisfies Meta<typeof FormFieldChromeStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
