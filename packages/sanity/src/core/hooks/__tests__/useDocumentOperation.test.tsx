import {type SanityClient} from '@sanity/client'
import {act, render} from '@testing-library/react'
import {
  type Ref,
  type RefObject,
  useCallback,
  useEffect,
  useImperativeHandle,
  useInsertionEffect,
  useRef,
} from 'react'
import {of} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {getFallbackLocaleSource} from '../../i18n/fallback'
import {type DocumentPreviewStore} from '../../preview/documentPreviewStore'
import {createSchema} from '../../schema/createSchema'
import {type OperationsAPI} from '../../store/document/document-pair/operations/types'
import {createDocumentStore, type DocumentStore} from '../../store/document/document-store'
import {type HistoryStore} from '../../store/history/createHistoryStore'
import {useDocumentOperation} from '../useDocumentOperation'

let documentStore: DocumentStore

vi.mock('../../store/datastores', () => ({useDocumentStore: () => documentStore}))
vi.mock('../useDocumentOperationWithHistory', () => ({
  useDocumentOperationWithHistory: ({api}: {api: OperationsAPI}) => api,
}))

const schema = createSchema({
  name: 'default',
  types: [
    {
      name: 'movie',
      type: 'document',
      fields: [
        {name: 'title', type: 'string'},
        {name: 'overview', type: 'text'},
      ],
    },
  ],
})

function createDocumentClient() {
  const actionRequest = vi.fn((..._args: unknown[]) => of({transactionId: 'tx'}))
  const client = {
    config: () => ({
      apiHost: 'mock.api.sanity.io',
      projectId: 'mock-project-id',
      dataset: 'pane-handover',
    }),
    observable: {
      action: actionRequest,
      getDocuments: vi.fn(() => of([null, null])),
      listen: vi.fn(() => of({type: 'welcome'})),
    },
    dataRequest: vi.fn(() => Promise.resolve({transactionId: 'tx'})),
    withConfig: vi.fn(),
  }
  client.withConfig.mockReturnValue(client)

  return {client: client as unknown as SanityClient, actionRequest}
}

interface EditorHandle {
  edit: () => void
}

/**
 * Stands in for the Portable Text editor: edits are batched and the pending batch is flushed
 * through `onChange` from the editor's effect cleanup when it unmounts.
 */
function Editor(props: {
  documentId: string
  onChange: (patches: unknown[]) => void
  ref: Ref<EditorHandle>
}) {
  const {documentId, onChange, ref} = props

  useImperativeHandle(ref, () => ({
    edit: () => onChange([{set: {title: `first edit in ${documentId}`}}]),
  }))

  useEffect(
    () => () => onChange([{set: {overview: `text typed into ${documentId}`}}]),
    [documentId, onChange],
  )

  return null
}

/** Stands in for `useDocumentForm`, which routes form patches through a ref. */
function DocumentPane(props: {documentId: string; editor: Ref<EditorHandle>}) {
  const {documentId, editor} = props
  const {patch} = useDocumentOperation(documentId, 'movie')
  const patchRef = useRef(patch)

  useInsertionEffect(() => {
    patchRef.current = patch
  }, [patch])

  const handleChange = useCallback(
    (patches: unknown[]) => patchRef.current.execute(patches, {_id: documentId, _type: 'movie'}),
    [documentId],
  )

  return <Editor documentId={documentId} onChange={handleChange} ref={editor} />
}

describe('useDocumentOperation', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('commits the edit a form flushes while unmounting when navigating to another document', async () => {
    const {client, actionRequest} = createDocumentClient()
    documentStore = createDocumentStore({
      getClient: () => client,
      documentPreviewStore: {} as unknown as DocumentPreviewStore,
      historyStore: {} as unknown as HistoryStore,
      initialValueTemplates: [],
      schema,
      i18n: getFallbackLocaleSource(),
    })

    const editor: RefObject<EditorHandle | null> = {current: null}

    // The document pane is keyed by document id, so navigating remounts it
    const {rerender, unmount} = render(
      <DocumentPane key="movie-a" documentId="movie-a" editor={editor} />,
    )
    await act(() => vi.advanceTimersByTimeAsync(0))

    // An edit that is committed right away, which opens the autocommit throttle window
    act(() => editor.current?.edit())
    await act(() => vi.advanceTimersByTimeAsync(0))
    expect(JSON.stringify(actionRequest.mock.calls)).toContain('first edit in movie-a')

    rerender(<DocumentPane key="movie-b" documentId="movie-b" editor={editor} />)
    await act(() => vi.advanceTimersByTimeAsync(1_000))

    expect(JSON.stringify(actionRequest.mock.calls)).toContain('text typed into movie-a')

    unmount()
  })
})
