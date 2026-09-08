import {render, screen, waitFor} from '@testing-library/react'
import {type ReactNode} from 'react'
import {IsLastPaneContext} from 'sanity/_singletons'
import {describe, expect, it} from 'vitest'

import {PerspectiveActiveDocumentProvider} from '../../../../perspective/activeDocument/PerspectiveActiveDocumentProvider'
import {usePerspectiveActiveDocument} from '../../../../perspective/activeDocument/usePerspectiveActiveDocument'
import {SetActiveDocument} from '../SetActiveDocument'

/** Renders whatever the perspective bar's dropdowns would read. */
function ActiveDocumentProbe() {
  const {activeDocument} = usePerspectiveActiveDocument()
  return (
    <div data-testid="probe">
      {activeDocument ? `${activeDocument.documentId}:${activeDocument.documentType}` : 'none'}
    </div>
  )
}

function Harness(props: {isLastPane: boolean; children: ReactNode}) {
  return (
    <PerspectiveActiveDocumentProvider>
      <IsLastPaneContext.Provider value={props.isLastPane}>
        {props.children}
      </IsLastPaneContext.Provider>
      <ActiveDocumentProbe />
    </PerspectiveActiveDocumentProvider>
  )
}

const probe = () => screen.getByTestId('probe').textContent

describe('SetActiveDocument', () => {
  it('publishes the document while it is the last pane', async () => {
    render(
      <Harness isLastPane>
        <SetActiveDocument documentId="book-1" documentType="book" />
      </Harness>,
    )

    await waitFor(() => expect(probe()).toBe('book-1:book'))
  })

  it('publishes nothing when it is not the last pane', async () => {
    render(
      <Harness isLastPane={false}>
        <SetActiveDocument documentId="book-1" documentType="book" />
      </Harness>,
    )

    // Long enough to outlast the provider's debounce window.
    await new Promise((resolve) => setTimeout(resolve, 300))
    expect(probe()).toBe('none')
  })

  it('normalizes a draft id to the published id', async () => {
    render(
      <Harness isLastPane>
        <SetActiveDocument documentId="drafts.book-1" documentType="book" />
      </Harness>,
    )

    await waitFor(() => expect(probe()).toBe('book-1:book'))
  })

  it('keeps a version id as-is, so the displayed version stays identifiable', async () => {
    render(
      <Harness isLastPane>
        <SetActiveDocument documentId="versions.summer.book-1" documentType="book" />
      </Harness>,
    )

    await waitFor(() => expect(probe()).toBe('versions.summer.book-1:book'))
  })

  it('publishes nothing until the form value resolves', async () => {
    render(
      <Harness isLastPane>
        <SetActiveDocument documentId={undefined} documentType={undefined} />
      </Harness>,
    )

    await new Promise((resolve) => setTimeout(resolve, 300))
    expect(probe()).toBe('none')
  })

  it('clears the selection when the document pane goes away', async () => {
    const {rerender} = render(
      <Harness isLastPane>
        <SetActiveDocument documentId="book-1" documentType="book" />
      </Harness>,
    )
    await waitFor(() => expect(probe()).toBe('book-1:book'))

    rerender(<Harness isLastPane>{null}</Harness>)

    await waitFor(() => expect(probe()).toBe('none'))
  })

  it('replaces rather than clears when navigating straight to another document', async () => {
    const {rerender} = render(
      <Harness isLastPane>
        <SetActiveDocument documentId="book-1" documentType="book" />
      </Harness>,
    )
    await waitFor(() => expect(probe()).toBe('book-1:book'))

    // The outgoing writer's cleanup queues `null` and the incoming one queues the
    // new document inside the same debounce window; only the latter must survive.
    rerender(
      <Harness isLastPane>
        <SetActiveDocument documentId="author-2" documentType="author" />
      </Harness>,
    )

    await waitFor(() => expect(probe()).toBe('author-2:author'))
    // And it must not flicker back to `none` afterwards.
    await new Promise((resolve) => setTimeout(resolve, 300))
    expect(probe()).toBe('author-2:author')
  })
})
