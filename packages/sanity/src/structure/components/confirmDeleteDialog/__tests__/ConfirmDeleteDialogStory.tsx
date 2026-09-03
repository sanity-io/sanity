import {defineField, defineType, type SanityDocument} from '@sanity/types'
import {Card, Stack, Text} from '@sanity/ui'
import noop from 'lodash-es/noop.js'
import {type HTMLProps, type ReactNode, useContext, useMemo} from 'react'
import {LocaleProvider, useSchema} from 'sanity'
import {DocumentPaneContext, PaneRouterContext} from 'sanity/_singletons'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {type DocumentPaneContextValue} from '../../../panes/document/DocumentPaneContext'
import {FixturePreviewStoreProvider} from '../../__tests__/FixturePreviewStoreProvider'
import {type ReferenceChildLinkProps} from '../../paneRouter/types'
import {ConfirmDeleteDialog} from '../ConfirmDeleteDialog'
import {ConfirmDeleteDialogBody} from '../ConfirmDeleteDialogBody'
import {OtherReferenceCount} from '../ConfirmDeleteDialogBody.styles'
import {VersionsPreviewList} from '../VersionsPreviewList'

const SCHEMA_TYPES = [
  defineType({
    name: 'author',
    type: 'document',
    title: 'Author',
    fields: [defineField({name: 'name', type: 'string'})],
    preview: {select: {title: 'name'}},
  }),
  defineType({
    name: 'book',
    type: 'document',
    title: 'Book',
    fields: [
      defineField({name: 'title', type: 'string'}),
      defineField({name: 'author', type: 'reference', to: [{type: 'author'}]}),
    ],
    preview: {select: {title: 'title'}},
  }),
]

const DOCUMENT_ID = 'author-1'
const TIMESTAMPS = {
  _rev: 'rev1',
  _createdAt: '2024-01-01T00:00:00Z',
  _updatedAt: '2024-01-02T00:00:00Z',
}
const AUTHOR_REF = {_type: 'reference', _ref: DOCUMENT_ID}

const DOCUMENTS: SanityDocument[] = [
  {_id: DOCUMENT_ID, _type: 'author', name: 'Jane Doe', ...TIMESTAMPS},
  {_id: `drafts.${DOCUMENT_ID}`, _type: 'author', name: 'Jane Doe (draft)', ...TIMESTAMPS},
  {_id: `versions.rSummerSale.${DOCUMENT_ID}`, _type: 'author', name: 'Jane Doe', ...TIMESTAMPS},
  {_id: 'book-1', _type: 'book', title: 'The Long Road Home', author: AUTHOR_REF, ...TIMESTAMPS},
  {
    _id: 'drafts.book-2',
    _type: 'book',
    title:
      'A second book with a title long enough to truncate inside the compact referring document row',
    author: AUTHOR_REF,
    ...TIMESTAMPS,
  },
]

const ALL_VERSIONS = [DOCUMENT_ID, `drafts.${DOCUMENT_ID}`, `versions.rSummerSale.${DOCUMENT_ID}`]

const INTERNAL_REFERENCES = {
  totalCount: 4,
  references: [
    {_id: 'book-1', _type: 'book'},
    {_id: 'drafts.book-2', _type: 'book'},
    {_id: 'legacy-doc-1', _type: 'retiredType'},
  ],
}

const CROSS_DATASET_REFERENCES = {
  totalCount: 3,
  references: [
    {projectId: 'abc123xy', datasetName: 'production', documentId: 'landingPage-front'},
    {projectId: 'abc123xy', datasetName: 'production', documentId: 'campaign-summer-2024'},
    {projectId: 'zz9plural'},
  ],
}

export type ConfirmDeleteDialogStoryMode = 'dialog' | 'referring-documents'

/**
 * `ReferencePreviewLink` wraps each referring document in the pane router's
 * `ReferenceChildLink`, whose default implementation throws outside the
 * structure tool. A plain anchor stands in; nothing navigates in a snapshot.
 */
function StubReferenceChildLink(
  props: ReferenceChildLinkProps & Omit<HTMLProps<HTMLAnchorElement>, 'children'>,
) {
  const {documentId, documentType, parentRefPath, template, ...rest} = props
  return <a href="#" {...rest} />
}

/**
 * `DocTitle` (rendered by the dialog copy) reads the document pane for the
 * title preview and `ReferencePreviewLink` reads the pane router; only the
 * fields they touch are stubbed. `LocaleProvider` backs the relative-time
 * copy in the version status tooltips, which `@sanity/ui` keeps mounted.
 */
function PaneStubs({children}: {children: ReactNode}) {
  const schema = useSchema()
  const paneRouter = useContext(PaneRouterContext)
  const paneRouterValue = useMemo(
    () => ({...paneRouter, ReferenceChildLink: StubReferenceChildLink}),
    [paneRouter],
  )
  const documentPaneValue = useMemo(
    () =>
      ({
        connectionState: 'connected',
        schemaType: schema.get('author'),
        isDeleted: false,
        lastRevisionDocument: null,
        value: DOCUMENTS[0],
        editState: null,
      }) as unknown as DocumentPaneContextValue,
    [schema],
  )

  return (
    <LocaleProvider>
      <PaneRouterContext.Provider value={paneRouterValue}>
        <DocumentPaneContext.Provider value={documentPaneValue}>
          {children}
        </DocumentPaneContext.Provider>
      </PaneRouterContext.Provider>
    </LocaleProvider>
  )
}

function Section({label, children}: {label: string; children: ReactNode}) {
  return (
    <Stack gap={2}>
      <Text muted size={1} weight="medium">
        {label}
      </Text>
      {children}
    </Stack>
  )
}

/**
 * The body states that need referring documents: internal references (two
 * books that resolve through the fixture preview store, one with a truncating
 * title, plus an unknown type that falls back to the "preview unavailable"
 * row), the "other references" overflow row, the collapsible cross-dataset
 * table with copy-id buttons and an unavailable dataset, and the shorter
 * unpublish copy. The CSF file expands the cross-dataset details before
 * capture.
 */
function ReferringDocuments() {
  return (
    <Card padding={4} style={{maxWidth: 560}}>
      <Stack gap={5}>
        <Section label="delete with internal and cross-dataset references">
          <ConfirmDeleteDialogBody
            action="delete"
            crossDatasetReferences={CROSS_DATASET_REFERENCES}
            datasetNames={['production']}
            documentId={DOCUMENT_ID}
            documentTitle="Jane Doe"
            documentType="author"
            documentVersions={ALL_VERSIONS}
            hasUnknownDatasetNames
            internalReferences={INTERNAL_REFERENCES}
            isLoading={false}
            onReferenceLinkClick={noop}
            projectIds={['abc123xy', 'zz9plural']}
            totalCount={7}
          />
        </Section>
        <Section label="unpublish without references">
          <ConfirmDeleteDialogBody
            action="unpublish"
            crossDatasetReferences={{totalCount: 0, references: []}}
            datasetNames={[]}
            documentId={DOCUMENT_ID}
            documentTitle="Jane Doe"
            documentType="author"
            documentVersions={[DOCUMENT_ID]}
            hasUnknownDatasetNames={false}
            internalReferences={{totalCount: 0, references: []}}
            isLoading={false}
            onReferenceLinkClick={noop}
            projectIds={[]}
            totalCount={0}
          />
        </Section>
        <Section label="versions: draft and published only">
          <VersionsPreviewList
            documentType="author"
            documentVersions={[`drafts.${DOCUMENT_ID}`, DOCUMENT_ID]}
          />
        </Section>
        <Section label="other reference count">
          <OtherReferenceCount totalCount={12} references={[{}, {}]} />
        </Section>
      </Stack>
    </Card>
  )
}

/**
 * Chromatic sentinel for the confirm-delete dialog ahead of the ui5 Flex
 * migration. `dialog` mounts the real dialog with reference checks disabled
 * (the variant-unpublish path, which the mock client can serve) so the header,
 * confirmation copy, the draft/published/release version rows and the footer
 * buttons are captured together; `referring-documents` lays the body states
 * out inline. Previews come from the fixture preview store; no network.
 */
export function ConfirmDeleteDialogStory(props: {mode: ConfirmDeleteDialogStoryMode}) {
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <FixturePreviewStoreProvider documents={DOCUMENTS}>
        <PaneStubs>
          {props.mode === 'dialog' ? (
            <ConfirmDeleteDialog
              action="delete"
              checkIncomingReferences={false}
              id={DOCUMENT_ID}
              onCancel={noop}
              onConfirm={noop}
              type="author"
            />
          ) : (
            <ReferringDocuments />
          )}
        </PaneStubs>
      </FixturePreviewStoreProvider>
    </TestWrapper>
  )
}
