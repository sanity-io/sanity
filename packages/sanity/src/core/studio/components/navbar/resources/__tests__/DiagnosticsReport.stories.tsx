import {type Meta, type StoryObj} from '@storybook/react-vite'

import {SATURATED_DIAGNOSTICS_FIXTURE} from './diagnosticsFixture'
import {DiagnosticsReportStory} from './DiagnosticsReportStory'

const meta = {
  title: 'Studio/Diagnostics Report',
  component: DiagnosticsReportStory,
} satisfies Meta<typeof DiagnosticsReportStory>

export default meta
type Story = StoryObj<typeof meta>

/** Complete report including generated CSS metrics for multiple styled-components runtimes. */
export const MultipleStyledComponentsRuntimes: Story = {}

/**
 * Studio tabs hold most of the browser's request slots: findings explain the full connection and
 * the stalled ping, the Connections section shows the counts, and skipped tests carry a reason.
 */
export const SaturatedConnection: Story = {
  args: {diagnostics: SATURATED_DIAGNOSTICS_FIXTURE},
}
