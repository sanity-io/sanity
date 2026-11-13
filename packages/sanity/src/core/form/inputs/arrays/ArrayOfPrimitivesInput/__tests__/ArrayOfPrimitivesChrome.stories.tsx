import {type Meta, type StoryObj} from '@storybook/react-vite'

import {ArrayOfPrimitivesChromeStory} from './ArrayOfPrimitivesChromeStory'

/**
 * Chromatic sentinel: primitive-array add buttons and empty placeholders
 * after the ui5 Grid/Text migration. Fixture schema types; menus stay
 * closed.
 */
const meta = {
  title: 'Inputs/Array Of Primitives Chrome',
  component: ArrayOfPrimitivesChromeStory,
} satisfies Meta<typeof ArrayOfPrimitivesChromeStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
