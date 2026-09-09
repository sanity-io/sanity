import {type Meta, type StoryObj} from '@storybook/react-vite'

import {DiagnosticsReportStory} from './DiagnosticsReportStory'

const meta = {
  title: 'Studio/Diagnostics Report',
  component: DiagnosticsReportStory,
} satisfies Meta<typeof DiagnosticsReportStory>

export default meta
type Story = StoryObj<typeof meta>

/** Complete report including generated CSS metrics for multiple styled-components runtimes. */
export const MultipleStyledComponentsRuntimes: Story = {}
