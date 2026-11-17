import {type SanityDocument} from '@sanity/client'
import {defineField, defineType} from '@sanity/types'
import noop from 'lodash-es/noop.js'
import {type ReactNode, useState} from 'react'
import {of} from 'rxjs'
import {
  DEFAULT_STUDIO_CLIENT_OPTIONS,
  type DocumentPreviewStore,
  LocaleProvider,
  ResourceCacheProvider,
  useClient,
  useResourceCache,
} from 'sanity'
import {DocumentPaneInfoContext, PaneRouterContext} from 'sanity/_singletons'
import {describe, expect, it, vi} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {testHelpers} from '../../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {
  type ChildLinkProps,
  type PaneRouterContextValue,
} from '../../../../../components/paneRouter/types'
import {type DocumentPaneInfoContextValue} from '../../../DocumentPaneContext'
import {IncomingReferenceDocument} from '../IncomingReferenceDocument'
import {IncomingReferencesList} from '../IncomingReferencesList'

// Presence subscribes to the workspace's bifur socket, which the mock studio has no answer for.
vi.mock('sanity', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  return {...actual, useDocumentPresence: () => []}
})

// The cross dataset lookup needs a client that can build dataset URLs; the mock client cannot,
// and this suite is about the same-dataset list.
vi.mock(
  '../../../../../components/incomingReferencesDecoration/CrossDatasetIncomingReference/getCrossDatasetIncomingReferences',
  () => ({getCrossDatasetIncomingReferences: () => of([])}),
)

const {settleChromaticEndState} = testHelpers()

const AUTHOR_ID = 'author-1'

const schemaTypes = [
  defineType({
    name: 'author',
    type: 'document',
    fields: [defineField({name: 'name', type: 'string'})],
  }),
  defineType({
    name: 'article',
    title: 'Article',
    type: 'document',
    fields: [
      defineField({name: 'title', type: 'string'}),
      defineField({name: 'author', type: 'reference', to: [{type: 'author'}]}),
    ],
    preview: {select: {title: 'title'}},
  }),
]

function referencingDocument(id: string, type: string, title: string): SanityDocument {
  return {
    _id: id,
    _type: type,
    _rev: `rev-${id}`,
    _createdAt: '2020-06-15T12:00:00Z',
    _updatedAt: '2020-07-20T12:00:00Z',
    title,
    author: {_type: 'reference', _ref: AUTHOR_ID},
  }
}

// Two articles plus a document of a type the schema no longer declares, so the list renders a
// titled section, the type name fallback and the missing type card.
const referencingDocuments = [
  referencingDocument('article-1', 'article', 'Spring issue'),
  referencingDocument('article-2', 'article', 'Summer issue'),
  referencingDocument('legacyPost-1', 'legacyPost', 'Archived post'),
]

/**
 * The mock studio's client answers every query with `null`, so the referencing document set,
 * the documents and their previews are served from the fixtures instead. Only the methods the
 * list and its previews call are stubbed.
 */
function stubPreviewStore(
  documents: SanityDocument[],
): Pick<
  DocumentPreviewStore,
  | 'observeForPreview'
  | 'unstable_observeDocument'
  | 'unstable_observeDocumentIdSet'
  | 'unstable_observeVersionDocumentIds'
> {
  const documentsById = new Map(documents.map((document) => [document._id, document]))
  return {
    observeForPreview: (value, type) => {
      const document = '_id' in value ? documentsById.get(value._id) : undefined
      return of({type, snapshot: document ? {title: document.title as string} : null})
    },
    unstable_observeDocument: (id) => of(documentsById.get(id)),
    unstable_observeDocumentIdSet: () =>
      of({status: 'connected' as const, documentIds: documents.map((document) => document._id)}),
    unstable_observeVersionDocumentIds: () => of([]),
  }
}

function SeededStores(props: {children: ReactNode; documents: SanityDocument[]}) {
  const {children, documents} = props
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const resourceCache = useResourceCache()
  // Seeded during the first render so `useDocumentPreviewStore` in the children finds the stub
  // instead of creating the real store.
  useState(() => {
    resourceCache.set({
      namespace: 'documentPreviewStore',
      dependencies: [client],
      value: stubPreviewStore(documents),
    })
    return null
  })
  return children
}

// The preview card renders as the pane router's child link, so the link has to render its
// children for the preview to show at all.
function ChildLink(props: ChildLinkProps & {className?: string}) {
  const {childId, childParameters, childPayload, children, ...rest} = props
  void childParameters
  void childPayload
  return (
    <a href={`#${childId}`} {...rest}>
      {children}
    </a>
  )
}

const paneRouter: PaneRouterContextValue = {
  index: 1,
  groupIndex: 1,
  siblingIndex: 0,
  payload: undefined,
  params: {},
  hasGroupSiblings: false,
  groupLength: 1,
  routerPanesState: [],
  BackLink: () => null,
  ChildLink,
  ReferenceChildLink: () => null,
  handleEditReference: noop,
  ParameterizedLink: () => null,
  replaceCurrent: noop,
  closeCurrentAndAfter: noop,
  closeCurrent: noop,
  duplicateCurrent: noop,
  setView: noop,
  setParams: noop,
  setPayload: noop,
  navigateIntent: noop,
  createPathWithParams: () => '',
}

const paneInfo = {documentId: AUTHOR_ID, documentType: 'author'} as DocumentPaneInfoContextValue

// The inspector panel gives the list a bounded box; the virtualized lists size from it.
const inspectorBox = {height: 560, width: 380}

function InspectorHarness(props: {children: ReactNode; documents?: SanityDocument[]}) {
  const {children, documents = referencingDocuments} = props
  return (
    <TestWrapper schemaTypes={schemaTypes}>
      <LocaleProvider>
        <ResourceCacheProvider>
          <SeededStores documents={documents}>
            <PaneRouterContext value={paneRouter}>
              <DocumentPaneInfoContext value={paneInfo}>
                <div data-testid="inspector-box" style={inspectorBox}>
                  {children}
                </div>
              </DocumentPaneInfoContext>
            </PaneRouterContext>
          </SeededStores>
        </ResourceCacheProvider>
      </LocaleProvider>
    </TestWrapper>
  )
}

// The preview cards fade in through an inline opacity, so the end state waits for every fade in
// the inspector to have finished.
async function expectFadedIn() {
  await expect
    .poll(() =>
      Array.from(
        page
          .getByTestId('inspector-box')
          .element()
          .querySelectorAll<HTMLElement>('[style*="opacity"]'),
      ).map((element) => element.style.opacity),
    )
    .toSatisfy(
      (opacities: string[]) =>
        opacities.length > 0 && opacities.every((opacity) => opacity === '1'),
    )
}

describe('IncomingReferencesList', () => {
  it('lists the referencing documents grouped by type', async () => {
    await render(
      <InspectorHarness>
        <IncomingReferencesList />
      </InspectorHarness>,
    )

    await expect
      .element(page.getByRole('listbox', {name: 'Incoming references of type Article'}))
      .toBeVisible()
    await expect.element(page.getByText('Spring issue')).toBeVisible()
    await expect.element(page.getByText('Summer issue')).toBeVisible()
    await expect
      .element(page.getByRole('listbox', {name: 'Incoming references of type legacyPost'}))
      .toBeVisible()
    await expect.element(page.getByText('Schema type legacyPost not found')).toBeVisible()
    await expectFadedIn()
    await settleChromaticEndState()
  })

  it('shows the empty state when nothing references the document', async () => {
    await render(
      <InspectorHarness documents={[]}>
        <IncomingReferencesList />
      </InspectorHarness>,
    )

    await expect.element(page.getByText('No incoming references found.')).toBeVisible()
    await settleChromaticEndState()
  })
})

describe('IncomingReferenceDocument', () => {
  it('links the preview to the field holding the reference', async () => {
    await render(
      <InspectorHarness>
        <IncomingReferenceDocument document={referencingDocuments[0]} referenceToId={AUTHOR_ID} />
      </InspectorHarness>,
    )

    const link = page.getByRole('link', {name: /Spring issue/})
    await expect.element(link).toBeVisible()
    await expectFadedIn()
    await settleChromaticEndState()
  })
})
