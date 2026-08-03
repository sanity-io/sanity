import {type Meta, type StoryObj} from '@storybook/react-vite'

import {ConfirmDeleteDialogBody} from '../../../../packages/sanity/src/structure/components/confirmDeleteDialog/ConfirmDeleteDialogBody'
import {RequestPermissionDialog} from '../../../../packages/sanity/src/structure/components/requestPermissionDialog/RequestPermissionDialog'
import {createMockDocumentPreviewStore} from '../../lib/mockDocumentPreviewStore'
import {OverlayStoryNotice} from '../../lib/overlayStoryNotice'
import {WithStubPaneRouter} from '../../lib/paneRouterStub'
import {WithStudioProviders} from '../../lib/testProvider'

const noop = () => undefined

/**
 * The reference list renders a real `ReferencePreviewLink` per referring document, which resolves
 * each `_type` against the workspace schema and THROWS `Schema type <name> not found` on a miss.
 * So the fixture documents and the schema have to agree - a story listing a `page` reference needs
 * a `page` type. That is the component being strict rather than the harness being fussy: a
 * reference to a type the schema does not define is genuinely broken data.
 */
/**
 * The referring documents are previewed for real, so they have to EXIST in a preview store.
 * Without one the preview subscription resolves to null and the layout throws on `.reduce`.
 */
const previewStore = createMockDocumentPreviewStore({
  documents: [
    {
      _id: 'page-home',
      _type: 'page',
      title: 'Home',
      _rev: 'r1',
      _createdAt: '2026-07-01T09:00:00Z',
      _updatedAt: '2026-07-01T09:00:00Z',
    },
    {
      _id: 'page-pricing',
      _type: 'page',
      title: 'Pricing',
      _rev: 'r2',
      _createdAt: '2026-07-01T09:00:00Z',
      _updatedAt: '2026-07-01T09:00:00Z',
    },
    {
      _id: 'nav-main',
      _type: 'navigation',
      title: 'Main navigation',
      _rev: 'r3',
      _createdAt: '2026-07-01T09:00:00Z',
      _updatedAt: '2026-07-01T09:00:00Z',
    },
    {
      _id: 'article-launch',
      _type: 'article',
      title: 'The launch announcement',
      _rev: 'r4',
      _createdAt: '2026-07-01T09:00:00Z',
      _updatedAt: '2026-07-01T09:00:00Z',
    },
  ] as never,
})

const dialogConfig = {
  name: 'default',
  title: 'Acme Content',
  schema: {
    name: 'default',
    types: [
      {
        name: 'article',
        title: 'Article',
        type: 'document',
        fields: [{name: 'title', title: 'Title', type: 'string'}],
      },
      {
        name: 'page',
        title: 'Page',
        type: 'document',
        fields: [{name: 'title', title: 'Title', type: 'string'}],
      },
      {
        name: 'navigation',
        title: 'Navigation',
        type: 'document',
        fields: [{name: 'title', title: 'Title', type: 'string'}],
      },
    ],
  },
}

const meta: Meta = {
  title: 'Document Pane/Structure Dialogs',
  // The reference list renders pane-router links. See `lib/paneRouterStub.tsx` for why stubbing
  // that context is legitimate here and stubbing `useDocumentPane` would not be.
  decorators: [WithStubPaneRouter, WithStudioProviders({config: dialogConfig, previewStore})],
  parameters: {
    docs: {
      description: {
        component: [
          'Deleting a document that nothing references is trivial. Deleting one that fifteen ' +
            'other documents point at breaks fifteen documents, and the editor pressing delete ' +
            'usually has no idea.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/structure/components/` |',
          '| Tier | SERVICE |',
          '| Patterns | `destructive-confirmation` · `reference-integrity` |',
          '',
          'These are the two dialogs the structure tool raises when an action needs more than a ' +
            'yes: deleting a document that other documents point at, and asking for permission you ' +
            'do not have.',
          '',
          'The delete dialog is the most careful destructive confirmation in the product, and the ' +
            'reason is referential integrity. So it does not ask "are you sure". It counts the ' +
            'references first, splits them into internal and cross-dataset, and lists the ' +
            'referring documents so an editor can go and look. It is slower to use on purpose.',
          '',
          'That counting is also why the body is a separate component from the dialog: the dialog ' +
            'runs the reference query and handles its loading and error states, while the body ' +
            'renders whatever the count turned out to be. This page stories the body, because the ' +
            'body is where the decisions are; the query wrapper needs a live dataset.',
          '',
          'Three harness notes: the reference list renders a real preview link per referring ' +
            'document, so the schema must define every type in the fixture or the preview throws. ' +
            'That link also needs the pane router context, stubbed here with inert anchors, which ' +
            'is safe precisely because the component reads that context for navigation rather than ' +
            'for state. And the referring documents are previewed for real, so they must exist in ' +
            'a seeded preview store; a missing one resolves to null and the preview layout throws.',
          '',
          'A shape worth copying rather than guessing: the body takes the exact object the ' +
            'underlying observable emits, including its loading flag, project ids, dataset names, ' +
            'and the unknown-dataset-names flag. Passing an invented shape compiles under a cast ' +
            'and then throws at render, because the component destructures arrays the fixture ' +
            'never had. Read the type, do not infer it from the props you think it needs.',
          '',
          '> **Why it matters:** the permission dialog is the other half of a pattern this codebase ' +
            'uses well. Rather than telling a viewer they cannot edit and stopping, it offers to ' +
            'send the request. An error message that ends in an action is worth several that do ' +
            'not.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:cms',
    'pattern:destructive-confirmation',
    'pattern:reference-integrity',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj

export const DeleteNoReferences: Story = {
  name: 'ConfirmDeleteDialogBody - nothing references it',
  parameters: {
    docs: {
      description: {
        story:
          'The safe case. Zero references, so the dialog is a plain confirmation - no list, no warning, no friction beyond the single click it deserves. Getting this case *quiet* is as much a design decision as getting the dangerous one loud.\n\nOne asymmetry worth noticing against the story below: this version does **not** name the document. It asks whether you are sure you want to delete all the versions of this document, while the referenced version names both the document and everything pointing at it. Defensible, since the reader just clicked delete on a document they are looking at - but the two confirmations answer "which document?" differently, and only one of them survives being read out of context.',
      },
    },
  },
  render: (_args, {viewMode, id, name}) =>
    viewMode === 'docs' ? (
      <OverlayStoryNotice title={name} storyId={id} />
    ) : (
      <ConfirmDeleteDialogBody
        action="delete"
        documentTitle="The launch announcement"
        documentId="article-launch"
        documentType="article"
        documentVersions={[]}
        isLoading={false}
        totalCount={0}
        projectIds={[]}
        datasetNames={[]}
        hasUnknownDatasetNames={false}
        internalReferences={{totalCount: 0, references: []}}
        crossDatasetReferences={{totalCount: 0, references: []}}
      />
    ),
}

export const DeleteWithReferences: Story = {
  name: 'ConfirmDeleteDialogBody - other documents point at it',
  parameters: {
    docs: {
      description: {
        story: [
          'Three documents reference this one, and the dialog lists them. Not a count in a ' +
            'sentence - the actual documents, previewed, so you can recognise them.',
          '',
          '"3 documents reference this" is a number you cannot act on; a list of three titles ' +
            'is three decisions you can make. It is also more expensive to render and slower to ' +
            'read, which is correct here and would be wrong on a routine confirmation.',
        ].join('\n'),
      },
    },
  },
  render: (_args, {viewMode, id, name}) =>
    viewMode === 'docs' ? (
      <OverlayStoryNotice title={name} storyId={id} />
    ) : (
      <ConfirmDeleteDialogBody
        action="delete"
        documentTitle="The launch announcement"
        documentId="article-launch"
        documentType="article"
        documentVersions={[]}
        isLoading={false}
        totalCount={3}
        projectIds={[]}
        datasetNames={[]}
        hasUnknownDatasetNames={false}
        internalReferences={{
          totalCount: 3,
          references: [
            {_id: 'page-home', _type: 'page'},
            {_id: 'page-pricing', _type: 'page'},
            {_id: 'nav-main', _type: 'navigation'},
          ],
        }}
        crossDatasetReferences={{totalCount: 0, references: []}}
      />
    ),
}

export const DeleteCrossDataset: Story = {
  name: 'ConfirmDeleteDialogBody - referenced from another dataset',
  parameters: {
    docs: {
      description: {
        story:
          'Cross-dataset references are counted separately, and correctly so: an internal reference is something you can go and fix, while a reference from another dataset may belong to a team you cannot see and cannot edit.\n\nThe dialog cannot list those documents - it has no read access to them - so it reports the count and says which dataset. Less information than the internal case, and honest about why.',
      },
    },
  },
  render: (_args, {viewMode, id, name}) =>
    viewMode === 'docs' ? (
      <OverlayStoryNotice title={name} storyId={id} />
    ) : (
      <ConfirmDeleteDialogBody
        action="delete"
        documentTitle="The launch announcement"
        documentId="article-launch"
        documentType="article"
        documentVersions={[]}
        isLoading={false}
        totalCount={5}
        projectIds={['abc123']}
        datasetNames={['marketing']}
        hasUnknownDatasetNames={false}
        internalReferences={{
          totalCount: 2,
          references: [
            {_id: 'page-home', _type: 'page'},
            {_id: 'nav-main', _type: 'navigation'},
          ],
        }}
        crossDatasetReferences={{
          totalCount: 3,
          references: [
            {projectId: 'abc123', datasetName: 'marketing', documentId: 'x1'},
            {projectId: 'abc123', datasetName: 'marketing', documentId: 'x2'},
            {projectId: 'abc123', datasetName: 'marketing'},
          ],
        }}
      />
    ),
}

export const Unpublish: Story = {
  name: 'ConfirmDeleteDialogBody - unpublishing rather than deleting',
  parameters: {
    docs: {
      description: {
        story:
          'The same body with `action="unpublish"`. Unpublishing is reversible and deleting is not, and the copy changes accordingly - the reference list is still shown, because a broken reference is broken whether the target was removed or merely hidden.',
      },
    },
  },
  render: (_args, {viewMode, id, name}) =>
    viewMode === 'docs' ? (
      <OverlayStoryNotice title={name} storyId={id} />
    ) : (
      <ConfirmDeleteDialogBody
        action="unpublish"
        documentTitle="The launch announcement"
        documentId="article-launch"
        documentType="article"
        documentVersions={[]}
        isLoading={false}
        totalCount={2}
        projectIds={[]}
        datasetNames={[]}
        hasUnknownDatasetNames={false}
        internalReferences={{
          totalCount: 2,
          references: [
            {_id: 'page-home', _type: 'page'},
            {_id: 'nav-main', _type: 'navigation'},
          ],
        }}
        crossDatasetReferences={{totalCount: 0, references: []}}
      />
    ),
}

export const RequestPermission: Story = {
  name: 'RequestPermissionDialog',
  parameters: {
    docs: {
      description: {
        story:
          'A viewer who needs to edit. Rather than a dead end, the dialog composes a request to the project administrators with an optional note.\n\nThe pattern generalises: the studio has several places where the answer is "you cannot do this", and the ones that also say "here is how to ask" are the ones that do not generate support tickets.',
      },
    },
  },
  render: (_args, {viewMode, id, name}) =>
    viewMode === 'docs' ? (
      <OverlayStoryNotice title={name} storyId={id} />
    ) : (
      <RequestPermissionDialog onClose={noop} onRequestSubmitted={noop} />
    ),
}
