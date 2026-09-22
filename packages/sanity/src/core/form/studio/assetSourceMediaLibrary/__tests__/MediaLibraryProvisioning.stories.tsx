import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, waitFor, within} from 'storybook/test'

import {MediaLibraryProvisioningStory} from './MediaLibraryProvisioningStory'

/**
 * Chromatic sentinel for inactive and unexpected-error media-library
 * provisioning chrome. The story uses local observable fixtures only.
 */
const meta = {
  title: 'Form/Asset Source/Media Library Provisioning',
  component: MediaLibraryProvisioningStory,
} satisfies Meta<typeof MediaLibraryProvisioningStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  play: async () => {
    const body = within(document.body)
    await waitFor(() => expect(body.getByTestId('media-library-absent-warning')).toBeVisible(), {
      timeout: 5000,
    })
    await waitFor(() => expect(body.getByTestId('MEDIA_LIBRARY_ERROR_UNEXPECTED')).toBeVisible(), {
      timeout: 5000,
    })
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
  },
}
