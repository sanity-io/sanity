import {renderHook} from '@testing-library/react'
import {type ComponentType, type ReactNode} from 'react'
import {beforeAll, expect, it, onTestFinished, vi} from 'vitest'

import {stubMessageBusHost} from '../../../../../test/testUtils/stubMessageBusHost'
import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {useDocumentApplicationContext} from '../useDocumentApplicationContext'

// The resource is the mock workspace's project and dataset.
function contextFor(id: string) {
  return {resource: {id: 'mock-project-id.mock-data-set', type: 'dataset'}, document: {id}}
}

let TestProvider: ComponentType<{children?: ReactNode}>

beforeAll(async () => {
  TestProvider = await createTestProvider()
})

function renderContext(displayedId: string | undefined) {
  return renderHook((id: string | undefined) => useDocumentApplicationContext(id), {
    wrapper: TestProvider,
    initialProps: displayedId,
  })
}

function captureContext() {
  return stubMessageBusHost().capture('applications.context.update')
}

it('sends the document once, not again when the document on screen changes', () => {
  const updates = captureContext()
  const {rerender} = renderContext('drafts.book-1')

  rerender('versions.summer.book-1')

  expect(updates).toEqual([contextFor('drafts.book-1')])
})

it('waits for the document to exist', () => {
  const updates = captureContext()
  const {rerender} = renderContext(undefined)
  expect(updates).toEqual([])

  rerender('drafts.book-1')

  expect(updates).toEqual([contextFor('drafts.book-1')])
})

it('keeps the context when the pane closes', () => {
  const updates = captureContext()
  const {unmount} = renderContext('book-1')

  unmount()

  expect(updates).toEqual([contextFor('book-1')])
})

it('sends nothing when Studio has no connection to an installed message bus', () => {
  const updates = captureContext()
  // Without an app id Studio can't connect to the bus.
  Reflect.deleteProperty(globalThis, '__SANITY_APP_ID__')
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  onTestFinished(() => warn.mockRestore())

  renderContext('book-1')

  expect(updates).toEqual([])
})
