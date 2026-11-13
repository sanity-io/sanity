import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, userEvent, waitFor, within} from 'storybook/test'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {ConfirmDeleteDialogBody} from '../ConfirmDeleteDialogBody'

// Internal references use a type the mock schema does not define, so the body
// renders its own "preview unavailable" row instead of a store-backed preview.
const REFERENCES = {
  isLoading: false,
  totalCount: 6,
  projectIds: ['abc123', 'xyz789'],
  datasetNames: ['production', 'staging'],
  hasUnknownDatasetNames: false,
  internalReferences: {
    totalCount: 3,
    references: [
      {_id: 'post-summer-launch', _type: 'legacyPost'},
      {_id: 'drafts.post-autumn-recap', _type: 'legacyPost'},
    ],
  },
  crossDatasetReferences: {
    totalCount: 3,
    references: [
      {projectId: 'abc123', datasetName: 'production', documentId: 'campaign-2026'},
      {projectId: 'abc123', datasetName: 'staging', documentId: 'landing-page-hero'},
    ],
  },
}

/**
 * Chromatic sentinel for the confirm delete/unpublish dialog body after the
 * ui5 Flex/Box migration: the referring documents layout (caution count card
 * with icon column, internal reference rows with the "other references"
 * footer, the collapsible cross-dataset summary card and its
 * project/dataset/id table). `action="unpublish"` keeps the store-backed
 * `VersionsPreviewList` out of the archive.
 */
const meta = {
  title: 'Structure/Confirm Delete Dialog Body',
  component: ConfirmDeleteDialogBody,
  decorators: [
    (Story) => (
      <TestWrapper schemaTypes={[]}>
        <div style={{maxWidth: 480}}>
          <Story />
        </div>
      </TestWrapper>
    ),
  ],
} satisfies Meta<typeof ConfirmDeleteDialogBody>

export default meta
type Story = StoryObj<typeof meta>

export const WithReferences: Story = {
  args: {
    ...REFERENCES,
    action: 'unpublish',
    documentId: 'summer-campaign',
    documentType: 'campaign',
    documentTitle: 'Summer campaign',
    documentVersions: ['summer-campaign', 'drafts.summer-campaign'],
  },
  // The cross-dataset table sits inside a closed <details>; open it so the
  // table columns are part of the snapshot, then drop focus from the summary
  // so the archive is about layout rather than a focus ring.
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    const summary = await canvas.findByText(/in 2 datasets/, {}, {timeout: 5000})
    await userEvent.click(summary)
    await waitFor(() =>
      expect(canvas.getByTestId('cross-dataset-references')).toHaveAttribute('open'),
    )
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
  },
}
