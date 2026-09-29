import {DocumentIcon} from '@sanity/icons/Document'
import {type SanityDocumentLike, type SchemaType} from '@sanity/types'
import {Box, Card, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, waitFor, within} from 'storybook/test'
import {VStack} from 'ui5'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {SanityDefaultPreview} from '../../../preview/components/SanityDefaultPreview'
import {type DocumentGroupInventoryComponents} from '../../types'
import {ConfirmDeleteDialog} from '../ConfirmDeleteDialog'
import {OtherReferenceCount} from '../ConfirmDeleteDialog.styles'
import {
  DIALOG_PORTAL_NAME,
  DialogPortalHost,
  type DocumentGroupHarnessOptions,
  DRAFT,
  PUBLISHED,
  REFERRING_DOCUMENTS,
  RELEASE_VERSION,
  useDocumentGroupHarness,
} from './DocumentGroupHarnessStory'

const AUTHOR_TYPE = {
  name: 'author',
  type: 'document',
  fields: [{name: 'name', type: 'string'}],
}

function DocTitle({document}: {document: SanityDocumentLike}) {
  return <>Article “{document._id}”</>
}

function ReferencePreviewLink({type, value}: {type: SchemaType; value: {_id: string}}) {
  return (
    <Box padding={2}>
      <SanityDefaultPreview
        icon={DocumentIcon}
        title={`${type.title ?? type.name} referencing this document`}
        subtitle={value._id}
        layout="default"
      />
    </Box>
  )
}

function VersionsPreviewList({
  documentVersions,
}: {
  documentType: string
  documentVersions: string[]
}) {
  return (
    <VStack gap={2}>
      {documentVersions.map((id) => (
        <Card key={id} border padding={3} radius={2}>
          <Text size={1}>{id}</Text>
        </Card>
      ))}
    </VStack>
  )
}

const COMPONENTS: DocumentGroupInventoryComponents = {
  DocTitle,
  ReferencePreviewLink,
  VersionsPreviewList,
}

function ConfirmDeleteDialogHarness(
  options: Pick<DocumentGroupHarnessOptions, 'selectedIds' | 'referringDocuments'>,
) {
  const {deletionRef, selectionRef} = useDocumentGroupHarness({
    ...options,
    activate: 'deletion',
  })

  return (
    <DialogPortalHost>
      <ConfirmDeleteDialog
        documentId={PUBLISHED.id}
        documentType="article"
        deletionRef={deletionRef}
        selectionRef={selectionRef}
        portalElementName={DIALOG_PORTAL_NAME}
        components={COMPONENTS}
      />
    </DialogPortalHost>
  )
}

/**
 * The inventory's delete confirmation, driven by a deletion machine that a
 * harness parent spawns with the referring-documents lookup replaced by fixed
 * fixtures. The pane-coupled preview components are stubbed.
 */
const meta = {
  title: 'Document Group Inventory/Confirm Delete Dialog',
  component: ConfirmDeleteDialog,
  decorators: [
    (Story) => (
      <TestWrapper schemaTypes={[AUTHOR_TYPE]}>
        <Story />
      </TestWrapper>
    ),
  ],
} satisfies Meta<typeof ConfirmDeleteDialog>

export default meta
type Story = StoryObj<typeof meta>

/** Deleting drafts and versions only: no incoming-reference check is needed. */
export const Versions: Story = {
  render: () => <ConfirmDeleteDialogHarness selectedIds={[DRAFT.id, RELEASE_VERSION.id]} />,
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    await waitFor(() => expect(canvas.getByText('Delete 2 versions')).toBeVisible(), {
      timeout: 3000,
    })
    await waitFor(() => expect(canvas.getByRole('button', {name: 'Delete (2)'})).toBeEnabled())
  },
}

/**
 * The published document is selected and other documents refer to it, so the
 * dialog warns and lists the internal and cross-dataset references. The
 * cross-dataset table is collapsed by default and expanded by the play step.
 */
export const WithIncomingReferences: Story = {
  render: () => (
    <ConfirmDeleteDialogHarness
      selectedIds={[PUBLISHED.id, DRAFT.id]}
      referringDocuments={REFERRING_DOCUMENTS}
    />
  ),
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    await waitFor(() => expect(canvas.getByText('Delete 2 versions')).toBeVisible(), {
      timeout: 3000,
    })
    const internal = await canvas.findByTestId('internal-references')
    await waitFor(() =>
      expect(within(internal).getByText('2 other references not shown')).toBeVisible(),
    )
    await waitFor(() => expect(within(internal).getByText('Preview unavailable')).toBeVisible())

    const details = canvas.getByTestId('cross-dataset-references')
    details.querySelector('summary')?.click()
    await waitFor(() => expect(details).toHaveAttribute('open'))
    await waitFor(() => expect(canvas.getByText('landing-page')).toBeVisible())
  },
}

/** The "N other references" note with its info tooltip, from the styles module. */
export const OtherReferences: Story = {
  render: () => (
    <Card border padding={2} radius={2} style={{display: 'inline-block'}}>
      <OtherReferenceCount totalCount={5} references={['a', 'b']} />
    </Card>
  ),
}
