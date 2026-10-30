import {defineField, defineType, type ObjectSchemaType, type ValidationMarker} from '@sanity/types'
import {type ReactNode} from 'react'
import {type EditStateFor, type SanityDocument, useSchema} from 'sanity'
import {DocumentPaneContext, DocumentPaneInfoContext} from 'sanity/_singletons'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {testHelpers} from '../../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {type DocumentPaneContextValue} from '../../../DocumentPaneContext'
import {ValidationInspector} from '../ValidationInspector'

const {settleChromaticEndState} = testHelpers()

const article = defineType({
  name: 'article',
  type: 'document',
  title: 'Article',
  fields: [
    defineField({name: 'title', type: 'string', title: 'Title'}),
    defineField({name: 'summary', type: 'text', title: 'Summary'}),
    defineField({
      name: 'author',
      type: 'object',
      title: 'Author',
      fields: [defineField({name: 'name', type: 'string', title: 'Name'})],
    }),
  ],
})

const schemaTypes = [article]

const DOCUMENT_ID = 'article-1'
const CREATED_AT = '2020-06-15T12:00:00.000Z'

const document: SanityDocument = {
  _id: DOCUMENT_ID,
  _type: 'article',
  _createdAt: CREATED_AT,
  _updatedAt: CREATED_AT,
  _rev: 'rev-1',
  title: '',
  summary: 'A short summary.',
  author: {name: 'A'},
}

const markers: ValidationMarker[] = [
  {path: ['title'], level: 'error', message: 'Title is required'},
  {path: ['author', 'name'], level: 'warning', message: 'Name should be at least 2 characters'},
  {path: ['summary'], level: 'info', message: 'Summaries longer than 20 characters rank better'},
]

function noop() {}

interface InspectorHarnessProps {
  children: ReactNode
  pane?: Partial<DocumentPaneContextValue>
}

function InspectorHarness(props: InspectorHarnessProps) {
  const {children, pane} = props
  const schemaType = useSchema().get('article') as ObjectSchemaType
  const value = {
    documentId: DOCUMENT_ID,
    documentType: 'article',
    schemaType,
    ready: true,
    value: document,
    displayed: document,
    validation: [],
    onFocus: noop,
    onPathOpen: noop,
    ...pane,
  } as DocumentPaneContextValue

  return (
    <DocumentPaneInfoContext value={value}>
      <DocumentPaneContext value={value}>{children}</DocumentPaneContext>
    </DocumentPaneInfoContext>
  )
}

function editState(version: Partial<SanityDocument>): EditStateFor {
  return {
    id: DOCUMENT_ID,
    type: 'article',
    transactionSyncLock: null,
    draft: null,
    published: document,
    version: {...document, ...version} as SanityDocument,
    liveEdit: false,
    liveEditSchemaType: false,
    ready: true,
    release: 'rSpring',
    scopeId: undefined,
  } as EditStateFor
}

describe('ValidationInspector', () => {
  it('lists error, warning and info markers with their field paths', async () => {
    await render(
      <TestWrapper schemaTypes={schemaTypes}>
        <InspectorHarness pane={{validation: markers}}>
          <ValidationInspector documentId={DOCUMENT_ID} documentType="article" onClose={noop} />
        </InspectorHarness>
      </TestWrapper>,
    )

    await expect.element(page.getByRole('heading', {name: 'Validation'})).toBeVisible()
    await expect.element(page.getByText('Title is required')).toBeVisible()
    await expect.element(page.getByText('Name should be at least 2 characters')).toBeVisible()
    await expect
      .element(page.getByText('Summaries longer than 20 characters rank better'))
      .toBeVisible()
    await expect.element(page.getByText('Author / Name')).toBeVisible()
    await settleChromaticEndState()
  })

  it('reports a clean document', async () => {
    await render(
      <TestWrapper schemaTypes={schemaTypes}>
        <InspectorHarness>
          <ValidationInspector documentId={DOCUMENT_ID} documentType="article" onClose={noop} />
        </InspectorHarness>
      </TestWrapper>,
    )

    await expect.element(page.getByText('No validation errors')).toBeVisible()
    await settleChromaticEndState()
  })

  it('hides markers for a version that is going to unpublish', async () => {
    await render(
      <TestWrapper schemaTypes={schemaTypes}>
        <InspectorHarness
          pane={{
            validation: markers,
            editState: editState({
              _id: `versions.rSpring.${DOCUMENT_ID}`,
              _system: {delete: true},
            }),
          }}
        >
          <ValidationInspector documentId={DOCUMENT_ID} documentType="article" onClose={noop} />
        </InspectorHarness>
      </TestWrapper>,
    )

    await expect
      .element(page.getByText('Document is going to unpublish, no validation errors are shown'))
      .toBeVisible()
    await expect.element(page.getByText('Title is required')).not.toBeInTheDocument()
    await settleChromaticEndState()
  })
})
