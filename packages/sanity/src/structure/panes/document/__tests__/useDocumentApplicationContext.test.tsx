import {renderHook} from '@testing-library/react'
import {type ComponentType, type ReactNode, StrictMode} from 'react'
import {type EditStateFor, SourceProvider, useWorkspace} from 'sanity'
import {beforeAll, expect, it} from 'vitest'

import {stubMessageBusHost} from '../../../../../test/testUtils/stubMessageBusHost'
import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {useDocumentApplicationContext} from '../useDocumentApplicationContext'

// The mock workspace's project and dataset.
const WORKSPACE_RESOURCE = 'mock-project-id.mock-data-set'

function contextFor(id: string, resource = WORKSPACE_RESOURCE) {
  return {resource: {id: resource, type: 'dataset'}, document: {id}}
}

const LOADING: EditStateFor = {
  id: 'book-1',
  type: 'book',
  transactionSyncLock: null,
  draft: null,
  published: null,
  version: null,
  liveEdit: false,
  liveEditSchemaType: false,
  ready: false,
  release: undefined,
  scopeId: undefined,
}

const DRAFT: EditStateFor = {
  ...LOADING,
  ready: true,
  draft: {_id: 'drafts.book-1', _type: 'book', _createdAt: '', _updatedAt: '', _rev: '1'},
}

const PUBLISHED: EditStateFor = {
  ...LOADING,
  ready: true,
  published: {_id: 'book-1', _type: 'book', _createdAt: '', _updatedAt: '', _rev: '1'},
}

let TestProvider: ComponentType<{children?: ReactNode}>

beforeAll(async () => {
  TestProvider = await createTestProvider()
})

function OtherSource({children}: {children: ReactNode}) {
  const [rootSource] = useWorkspace().unstable_sources
  return (
    <SourceProvider source={{...rootSource, projectId: 'other-project', dataset: 'other-dataset'}}>
      {children}
    </SourceProvider>
  )
}

interface Options {
  displayedId: string | undefined
  editState: EditStateFor
}

// StrictMode runs mount effects twice, which must not send the context twice.
function renderContext(initialProps: Options, {otherSource = false} = {}) {
  return renderHook((options: Options) => useDocumentApplicationContext(options), {
    wrapper: ({children}) => (
      <StrictMode>
        <TestProvider>
          {otherSource ? <OtherSource>{children}</OtherSource> : children}
        </TestProvider>
      </StrictMode>
    ),
    initialProps,
  })
}

function captureContext() {
  return stubMessageBusHost().capture('applications.context.update')
}

it('waits for a draft shown from its published sibling until the draft exists', () => {
  const updates = captureContext()
  const {rerender} = renderContext({displayedId: 'drafts.book-1', editState: PUBLISHED})
  expect(updates).toEqual([])

  rerender({displayedId: 'drafts.book-1', editState: {...PUBLISHED, draft: DRAFT.draft}})

  expect(updates).toEqual([contextFor('drafts.book-1')])
})

it('sends a published document', () => {
  const updates = captureContext()

  renderContext({displayedId: 'book-1', editState: PUBLISHED})

  expect(updates).toEqual([contextFor('book-1')])
})

it('sends the document once, not again when the document on screen changes', () => {
  const updates = captureContext()
  const {rerender} = renderContext({displayedId: 'drafts.book-1', editState: DRAFT})

  rerender({displayedId: 'versions.summer.book-1', editState: DRAFT})

  expect(updates).toEqual([contextFor('drafts.book-1')])
})

it('waits for the document to exist, even with an id on screen', () => {
  const updates = captureContext()
  const {rerender} = renderContext({
    displayedId: 'drafts.book-1',
    editState: {...DRAFT, ready: false},
  })
  rerender({displayedId: 'drafts.book-1', editState: {...LOADING, ready: true}})
  expect(updates).toEqual([])

  rerender({displayedId: 'drafts.book-1', editState: DRAFT})

  expect(updates).toEqual([contextFor('drafts.book-1')])
})

it('keeps the context when the pane closes', () => {
  const updates = captureContext()
  const {unmount} = renderContext({displayedId: 'drafts.book-1', editState: DRAFT})

  unmount()

  expect(updates).toEqual([contextFor('drafts.book-1')])
})

it('sends the project and dataset of the source the pane shows', () => {
  const updates = captureContext()

  renderContext({displayedId: 'drafts.book-1', editState: DRAFT}, {otherSource: true})

  expect(updates).toEqual([contextFor('drafts.book-1', 'other-project.other-dataset')])
})

it('does nothing when Studio runs standalone', () => {
  expect(() => renderContext({displayedId: 'drafts.book-1', editState: DRAFT})).not.toThrow()
})
