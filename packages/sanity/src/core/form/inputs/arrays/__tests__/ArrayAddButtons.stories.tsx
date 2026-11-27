import {type Meta, type StoryObj} from '@storybook/react-vite'
import {within} from 'storybook/test'

import {ArrayAddButtonsStory} from './ArrayAddButtonsStory'

/**
 * Chromatic sentinel: array add-item footers (`ArrayOfObjectsFunctions` and
 * `ArrayOfPrimitivesFunctions`) after the ui5 Grid migration. Enabled, multi-type,
 * read-only and max-reached buttons; menus stay closed.
 */
const meta = {
  title: 'Inputs/Array Add Buttons',
  component: ArrayAddButtonsStory,
} satisfies Meta<typeof ArrayAddButtonsStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    await canvas.findByTestId('add-single-object-button', {}, {timeout: 5_000})
    await canvas.findByTestId('add-multiple-object-button')
    await canvas.findByTestId('add-read-object-button')
    await canvas.findByTestId('add-max-reached-object-button')
    await canvas.findByTestId('add-multiple--primitive-button')
    await canvas.findByTestId('add-single-primitive-button')
    await canvas.findByTestId('add-max-reached-primitive-button')
  },
}
