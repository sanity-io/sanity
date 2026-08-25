import {type Meta, type StoryObj} from '@storybook/react-vite'

import {CommentsInspectorErrorStory} from './CommentsInspectorErrorStory'

/**
 * Comments inspector error state, recently migrated onto ui5 `Box` wrapping a
 * critical `Card`. Guards Box padding against the nested card tone — a mix
 * that type-checking will not catch. `TestWrapper` supplies studio i18n for
 * the title string. The error message is a fixed fixture (no stack/time).
 */
const meta = {
  title: 'Comments/Inspector Error',
  component: CommentsInspectorErrorStory,
} satisfies Meta<typeof CommentsInspectorErrorStory>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
