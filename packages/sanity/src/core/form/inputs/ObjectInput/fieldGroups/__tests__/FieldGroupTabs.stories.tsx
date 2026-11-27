import {type Meta, type StoryObj} from '@storybook/react-vite'
import {within} from 'storybook/test'

import {FieldGroupTabsStory} from './FieldGroupTabsStory'

/**
 * Chromatic sentinel: object field-group tabs (selected, disabled, validation
 * icons) and the compact ElementQuery Select. Studio i18n only; no form
 * document.
 */
const meta = {
  title: 'Inputs/Field Group Tabs',
  component: FieldGroupTabsStory,
} satisfies Meta<typeof FieldGroupTabsStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    await canvas.findAllByTestId('field-group-root', {}, {timeout: 5_000})
  },
}
