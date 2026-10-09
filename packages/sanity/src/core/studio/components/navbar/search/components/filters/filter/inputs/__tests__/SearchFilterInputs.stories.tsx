import {type Meta, type StoryObj} from '@storybook/react-vite'

import {SearchFilterInputsStory} from './SearchFilterInputsStory'

/**
 * Chromatic sentinel: global-search boolean Select, number TextInput and
 * string TextInput after a ui5 migration of those primitives. Studio i18n
 * only; no live queries.
 */
const meta = {
  title: 'Studio/Search Filter Inputs',
  component: SearchFilterInputsStory,
} satisfies Meta<typeof SearchFilterInputsStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
