import {type Meta, type StoryObj} from '@storybook/react-vite'

import {ToolbarStory} from './ToolbarStory'

/**
 * Reuses the `Toolbar.browser.test.tsx` harness. At the default 1280px
 * viewport the toolbar renders all buttons; the vitest browser tests cover the
 * collapsed overflow-menu behavior at narrower viewports.
 */
const meta = {
  title: 'Portable Text/Toolbar',
  component: ToolbarStory,
  parameters: {chromatic: {delay: 300}},
} satisfies Meta<typeof ToolbarStory>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
