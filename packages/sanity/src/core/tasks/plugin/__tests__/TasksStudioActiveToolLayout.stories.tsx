import {type Meta, type StoryObj} from '@storybook/react-vite'

import {TasksStudioActiveToolLayoutStory} from './TasksStudioActiveToolLayoutStory'

/**
 * Tasks active tool layout with the sidebar open before the plan check has answered: the
 * Suspense boundary around the sidebar shows a full-height card with a centered spinner inside
 * the 360px sidebar layer, next to the tool. This is the state a `?sidebar=tasks` link or an
 * early navbar click lands on, and the one that used to render as nothing.
 */
const meta = {
  title: 'Tasks/Active Tool Layout',
  component: TasksStudioActiveToolLayoutStory,
} satisfies Meta<typeof TasksStudioActiveToolLayoutStory>

export default meta
type Story = StoryObj<typeof meta>

export const SidebarLoading: Story = {}
