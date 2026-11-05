import {type Meta, type StoryObj} from '@storybook/react-vite'

import {AssetSourceListsStory} from './AssetSourceListsStory'

/**
 * Reuses the in-package harness: empty dataset file and image asset lists
 * after the ui5 Text migration. Header columns and the empty thumb grid,
 * no asset rows (those render relative dates).
 */
const meta = {
  title: 'Form/Asset Source Lists',
  component: AssetSourceListsStory,
} satisfies Meta<typeof AssetSourceListsStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
