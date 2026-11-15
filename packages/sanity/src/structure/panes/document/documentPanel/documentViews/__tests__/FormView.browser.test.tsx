import {defineField, defineType, type ObjectSchemaType} from '@sanity/types'
import {type EditStateFor, type SanityDocument, useSchema} from 'sanity'
import {DocumentPaneContext, PaneRouterContext} from 'sanity/_singletons'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {testHelpers} from '../../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {useFormState} from '../../../../../../core/form/store/useFormState'
import {EMPTY_ARRAY} from '../../../../../../core/util/empty'
import {type PaneRouterContextValue} from '../../../../../components/paneRouter/types'
import {type DocumentPaneContextValue} from '../../../DocumentPaneContext'
import {FormView} from '../FormView'

const {settleChromaticEndState} = testHelpers()

const article = defineType({
  name: 'article',
  type: 'document',
  title: 'Article',
  fields: [
    defineField({name: 'title', type: 'string', title: 'Title'}),
    defineField({name: 'summary', type: 'text', title: 'Summary', rows: 2}),
  ],
})

const schemaTypes = [article]

const DOCUMENT_ID = 'article-1'

const articleDocument: SanityDocument = {
  _id: `drafts.${DOCUMENT_ID}`,
  _type: 'article',
  _createdAt: '2025-01-02T12:00:00Z',
  _updatedAt: '2025-01-03T12:00:00Z',
  _rev: 'rev-1',
  title: 'Spring launch article',
  summary: 'Everything that ships with the spring launch.',
}

const MARGINS: [number, number, number, number] = [0, 0, 0, 0]

function noop() {}

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
  ChildLink: () => null,
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

function editState(overrides: Partial<EditStateFor> = {}): EditStateFor {
  return {
    id: DOCUMENT_ID,
    type: 'article',
    transactionSyncLock: null,
    draft: articleDocument,
    published: null,
    version: null,
    liveEdit: false,
    liveEditSchemaType: false,
    ready: true,
    release: undefined,
    scopeId: undefined,
    ...overrides,
  }
}

interface FormViewHarnessProps {
  pane?: Partial<DocumentPaneContextValue>
  hideForm?: boolean
}

function FormViewHarness(props: FormViewHarnessProps) {
  const {pane, hideForm = false} = props
  const schemaType = useSchema().get('article') as ObjectSchemaType
  const formState = useFormState({
    schemaType,
    documentValue: articleDocument,
    comparisonValue: null,
    focusPath: EMPTY_ARRAY,
    openPath: EMPTY_ARRAY,
    collapsedPaths: undefined,
    collapsedFieldSets: undefined,
    fieldGroupState: undefined,
    presence: EMPTY_ARRAY,
    validation: EMPTY_ARRAY,
    perspective: 'drafts',
    hasUpstreamVersion: false,
    hasBaseVariant: false,
  })

  const value = {
    documentId: DOCUMENT_ID,
    documentType: 'article',
    schemaType,
    connectionState: 'connected',
    ready: true,
    value: articleDocument,
    displayed: articleDocument,
    editState: editState(),
    formState: hideForm ? null : formState,
    syncState: 'synced',
    targetDocumentState: {status: 'resolving'},
    collapsedFieldSets: undefined,
    collapsedPaths: undefined,
    compareValue: null,
    fieldActions: EMPTY_ARRAY,
    focusPath: EMPTY_ARRAY,
    openPath: EMPTY_ARRAY,
    inspectOpen: false,
    hasUpstreamVersion: false,
    validation: EMPTY_ARRAY,
    onChange: noop,
    onBlur: noop,
    onFocus: noop,
    onPathOpen: noop,
    onSetActiveFieldGroup: noop,
    onSetCollapsedFieldSet: noop,
    onSetCollapsedPath: noop,
    ...pane,
  } as DocumentPaneContextValue

  return (
    <PaneRouterContext value={paneRouter}>
      <DocumentPaneContext value={value}>
        <FormView hidden={false} margins={MARGINS} />
      </DocumentPaneContext>
    </PaneRouterContext>
  )
}

describe('form view', () => {
  it('renders the document form', async () => {
    await render(
      <TestWrapper schemaTypes={schemaTypes}>
        <FormViewHarness />
      </TestWrapper>,
    )

    const form = page.getByTestId('form-view')
    await expect.element(form).not.toHaveAttribute('data-read-only')
    await expect
      .element(form.getByRole('textbox', {name: 'Title'}))
      .toHaveValue('Spring launch article')
    await expect
      .element(form.getByRole('textbox', {name: 'Summary'}))
      .toHaveValue('Everything that ships with the spring launch.')
    await settleChromaticEndState()
  })

  it('renders the form read-only while reconnecting', async () => {
    await render(
      <TestWrapper schemaTypes={schemaTypes}>
        <FormViewHarness pane={{connectionState: 'reconnecting'}} />
      </TestWrapper>,
    )

    const form = page.getByTestId('form-view')
    await expect.element(form).toHaveAttribute('data-read-only', 'true')
    await settleChromaticEndState()
  })

  it('tells the user when the form is hidden', async () => {
    await render(
      <TestWrapper schemaTypes={schemaTypes}>
        <FormViewHarness hideForm />
      </TestWrapper>,
    )

    await expect.element(page.getByText('This form is hidden')).toBeVisible()
    await settleChromaticEndState()
  })

  it('warns while the document is locked and its changes are not saving', async () => {
    await render(
      <TestWrapper schemaTypes={schemaTypes}>
        <FormViewHarness
          pane={{
            editState: editState({transactionSyncLock: {enabled: true}}),
            syncState: 'stalled',
          }}
        />
      </TestWrapper>,
    )

    await expect.element(page.getByText('Syncing document…')).toBeVisible()
    await expect.element(page.getByText("Your changes still aren't saving")).toBeVisible()
    await settleChromaticEndState()
  })
})
