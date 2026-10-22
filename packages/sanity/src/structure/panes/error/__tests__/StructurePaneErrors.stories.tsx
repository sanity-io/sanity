import {type Meta, type StoryObj} from '@storybook/react-vite'

import {StructurePaneErrorsStory} from './StructurePaneErrorsStory'

/**
 * Chromatic sentinel: structure ErrorPane and UnknownPane after the ui5 Box
 * migration. Critical tone and missing/unknown type copy. No stack traces.
 */
const meta = {
  title: 'Structure/Pane Errors',
  component: StructurePaneErrorsStory,
} satisfies Meta<typeof StructurePaneErrorsStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
