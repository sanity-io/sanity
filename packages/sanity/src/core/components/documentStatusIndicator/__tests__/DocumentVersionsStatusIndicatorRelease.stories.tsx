import {type Meta, type StoryObj} from '@storybook/react-vite'

import {DocumentVersionsStatusIndicatorReleaseStory} from './DocumentVersionsStatusIndicatorReleaseStory'

/**
 * Release-perspective status icons: ASAP, scheduled, and undecided, for every
 * in-release and variant membership.
 */
const meta = {
  title: 'Studio/Document Status Indicator in Releases',
  component: DocumentVersionsStatusIndicatorReleaseStory,
} satisfies Meta<typeof DocumentVersionsStatusIndicatorReleaseStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
