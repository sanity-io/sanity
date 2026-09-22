import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, userEvent, waitFor, within} from 'storybook/test'

import {
  AssetDeleteDialogStory,
  DatasetFileListStory,
  SelectAssetsDialogStory,
} from './DatasetAssetsStory'

/**
 * Chromatic sentinels for the dataset file source after the misc form Stack
 * migration. Assets, byte sizes, and filenames are fixed fixtures; invalid
 * creation dates deliberately render an empty stable date cell.
 */
const meta = {
  title: 'Form/Asset Source/Dataset Files',
  component: DatasetFileListStory,
} satisfies Meta<typeof DatasetFileListStory>

export default meta
type Story = StoryObj<typeof meta>

export const FileList: Story = {
  play: async () => {
    const mobileRow = within(document.body).getByTestId('mobile-asset-row')
    const expandButton = mobileRow.querySelector('button:not([data-id])')
    if (!(expandButton instanceof HTMLButtonElement)) {
      throw new Error('Expected the mobile asset-row expand button')
    }
    await userEvent.click(expandButton)
    await waitFor(() => expect(within(mobileRow).getByText('Show usage')).toBeVisible())
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
  },
}

export const DeleteDialog: Story = {
  render: () => <AssetDeleteDialogStory />,
  play: async () => {
    const body = within(document.body)
    await waitFor(() => expect(body.getByRole('dialog')).toBeVisible(), {timeout: 5000})
    await waitFor(() =>
      expect(body.getByText('quarterly-report-final-approved-version.pdf')).toBeVisible(),
    )
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
  },
}

export const SelectDialog: Story = {
  render: () => <SelectAssetsDialogStory />,
  play: async () => {
    const body = within(document.body)
    await waitFor(() => expect(body.getByRole('dialog')).toBeVisible(), {timeout: 5000})
    await waitFor(() => expect(body.getByText('PDF Document')).toBeVisible(), {timeout: 5000})
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
  },
}
