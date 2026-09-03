import {DocumentIcon} from '@sanity/icons/Document'
import {TrashIcon} from '@sanity/icons/Trash'
import {defineField, defineType, type SanityDocument} from '@sanity/types'
import {Card, Stack, Text} from '@sanity/ui'
import noop from 'lodash-es/noop.js'
import {type HTMLProps, type ReactNode, useContext, useMemo} from 'react'
import {LocaleProvider} from 'sanity'
import {DocumentPaneContext, PaneRouterContext} from 'sanity/_singletons'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {type DocumentPaneContextValue} from '../../../panes/document/DocumentPaneContext'
import {FixturePreviewStoreProvider} from '../../__tests__/FixturePreviewStoreProvider'
import {type ChildLinkProps} from '../../paneRouter/types'
import {CrossDatasetIncomingReferenceDocumentPreview} from '../CrossDatasetIncomingReference/CrossDatasetIncomingReferenceDocumentPreview'
import {type CrossDatasetIncomingReferenceDocument} from '../CrossDatasetIncomingReference/getCrossDatasetIncomingReferences'
import {IncomingReferenceDocument} from '../IncomingReferenceDocument'
import {IncomingReferencesDecoration} from '../IncomingReferencesDecoration'
import {IncomingReferencesList} from '../IncomingReferencesList'
import {IncomingReferencesType} from '../IncomingReferencesType'
import {type CrossDatasetIncomingReference, type IncomingReferenceAction} from '../types'

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
  defineType({
    name: 'article',
    type: 'document',
    title: 'Article',
    fields: [
      defineField({name: 'headline', type: 'string'}),
      defineField({name: 'author', type: 'reference', to: [{type: 'author'}]}),
    ],
    preview: {select: {title: 'headline'}},
  }),
]

const AUTHOR_ID = 'author-1'
const TIMESTAMPS = {
  _rev: 'rev1',
  _createdAt: '2024-01-01T00:00:00Z',
  _updatedAt: '2024-01-02T00:00:00Z',
}
const AUTHOR_REF = {_type: 'reference', _ref: AUTHOR_ID}

const AUTHOR: SanityDocument = {_id: AUTHOR_ID, _type: 'author', name: 'Jane Doe', ...TIMESTAMPS}
const BOOKS: SanityDocument[] = [
  {_id: 'book-1', _type: 'book', title: 'The Long Road Home', author: AUTHOR_REF, ...TIMESTAMPS},
  {
    _id: 'drafts.book-2',
    _type: 'book',
    title: 'A second book whose title is long enough to truncate inside the incoming reference row',
    author: AUTHOR_REF,
    ...TIMESTAMPS,
  },
]
const DOCUMENTS = [AUTHOR, ...BOOKS]

const UNLINK_ACTION: IncomingReferenceAction = () => ({
  label: 'Unlink from author',
  icon: TrashIcon,
  tone: 'critical',
  onHandle: noop,
})

const CROSS_DATASET_TYPE: CrossDatasetIncomingReference = {
  type: 'landingPage',
  title: 'Landing pages',
  dataset: 'marketing',
  preview: {select: {title: 'title'}},
  studioUrl: ({id}) => `https://marketing.sanity.studio/desk/landingPage;${id}`,
}

const CROSS_DATASET_DOCUMENTS: CrossDatasetIncomingReferenceDocument[] = [
  {
    id: 'landingPage-front',
    type: 'landingPage',
    availability: {available: true, reason: 'READABLE'},
    preview: {
      published: {title: 'Front page', subtitle: 'Dataset: marketing', media: <DocumentIcon />},
    },
    projectId: 'abc123xy',
    dataset: 'marketing',
  },
  {
    id: 'landingPage-hidden',
    type: 'landingPage',
    availability: {available: false, reason: 'PERMISSION_DENIED'},
    preview: {published: undefined},
    projectId: 'abc123xy',
    dataset: 'marketing',
  },
]

/**
 * `IncomingReferencePreview` links each row through the pane router's
 * `ChildLink`, whose default implementation throws outside the structure
 * tool. A plain anchor stands in; nothing navigates in a snapshot.
 */
function StubChildLink(props: ChildLinkProps & Omit<HTMLProps<HTMLAnchorElement>, 'children'>) {
  const {childId, childParameters, childPayload, ...rest} = props
  return <a href="#" {...rest} />
}

/**
 * The list reads the referenced document from the document pane; only the
 * fields the incoming-reference components touch are stubbed. `LocaleProvider`
 * backs the relative-time copy in the version status tooltips, which
 * `@sanity/ui` keeps mounted.
 */
function PaneStubs({children}: {children: ReactNode}) {
  const paneRouter = useContext(PaneRouterContext)
  const paneRouterValue = useMemo(() => ({...paneRouter, ChildLink: StubChildLink}), [paneRouter])
  const documentPaneValue = useMemo(
    () =>
      ({
        documentId: AUTHOR_ID,
        documentType: 'author',
        displayed: AUTHOR,
        editState: {
          id: AUTHOR_ID,
          type: 'author',
          ready: true,
          liveEdit: false,
          transactionSyncLock: null,
          draft: null,
          published: AUTHOR,
          version: undefined,
        },
      }) as unknown as DocumentPaneContextValue,
    [],
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
 * Chromatic sentinel for the incoming-references field decoration ahead of
 * the ui5 Flex migration: the decoration header row, a populated list with
 * truncating titles and the per-row actions menu, the "link existing" button
 * variant next to an empty type, the multi-type headings, the no-types
 * critical card, the unknown-type row error, and the cross-dataset preview
 * rows with and without a studio link. Referring documents come from the
 * fixture preview store; the cross-dataset list itself needs the references
 * API and is represented by its row component. No network.
 */
export function IncomingReferencesStory() {
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <FixturePreviewStoreProvider documents={DOCUMENTS}>
        <PaneStubs>
          <Card padding={4} style={{maxWidth: 560}}>
            <Stack gap={5}>
              <Section label="field decoration with actions">
                <IncomingReferencesDecoration
                  actions={[UNLINK_ACTION]}
                  description="Books whose author field points at this document."
                  name="books"
                  title="Books by this author"
                  types={[{type: 'book'}]}
                />
              </Section>
              <Section label="multiple types, link existing documents">
                <IncomingReferencesList
                  creationAllowed
                  name="mentions"
                  onLinkDocument={() => false}
                  types={[
                    {type: 'book', title: 'Books'},
                    {type: 'article', title: 'Articles'},
                  ]}
                />
              </Section>
              <Section label="single type without actions or creation">
                <IncomingReferencesType
                  actions={undefined}
                  creationAllowed={false}
                  fieldName="books"
                  filter={undefined}
                  filterParams={undefined}
                  onLinkDocument={undefined}
                  referenced={{id: AUTHOR_ID, type: 'author'}}
                  shouldRenderTitle={false}
                  type={{type: 'book'}}
                />
              </Section>
              <Section label="no types configured">
                <IncomingReferencesList name="broken" types={[]} />
              </Section>
              <Section label="row for a document of an unknown type">
                <IncomingReferenceDocument
                  actions={undefined}
                  document={{_id: 'legacy-1', _type: 'retiredType', ...TIMESTAMPS}}
                  referenceToId={AUTHOR_ID}
                />
              </Section>
              <Section label="cross-dataset rows: studio link, no access">
                <Card border padding={1} radius={2}>
                  <Stack>
                    <CrossDatasetIncomingReferenceDocumentPreview
                      document={CROSS_DATASET_DOCUMENTS[0]}
                      type={CROSS_DATASET_TYPE}
                    />
                    <CrossDatasetIncomingReferenceDocumentPreview
                      document={CROSS_DATASET_DOCUMENTS[1]}
                    />
                  </Stack>
                </Card>
              </Section>
            </Stack>
          </Card>
        </PaneStubs>
      </FixturePreviewStoreProvider>
    </TestWrapper>
  )
}
