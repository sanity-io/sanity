import {type Meta, type StoryObj} from '@storybook/react-vite'

import {ReleasesEmptyStatesStory} from './ReleasesEmptyStatesStory'

/**
 * Chromatic sentinel: releases and scheduled-drafts empty states after the
 * ui5 Flex migration. Illustration plus centered title, body, and ghost
 * documentation link. Copy is locale-fixture only.
 */
const meta = {
  title: 'Releases/Empty States',
  component: ReleasesEmptyStatesStory,
} satisfies Meta<typeof ReleasesEmptyStatesStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
