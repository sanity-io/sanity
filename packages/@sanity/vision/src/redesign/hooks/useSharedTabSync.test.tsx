import {act, renderHook} from '@testing-library/react'
import {type ReactNode, type RefObject} from 'react'
import {defer, NEVER, of, startWith, Subject} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {createActor, createMachine} from 'xstate'

import {type VisionCodeMirrorHandle} from '../../codemirror/VisionCodeMirror'
import {type VisionTab} from '../store/types'
import {VisionActorContext} from '../store/VisionActorContext'
import {visionMachine} from '../store/visionMachine'
import {createInitialState} from '../store/visionStorage'
import {toStoredOptions} from '../util/sharedTabDocument'
import {useSharedTabSync} from './useSharedTabSync'

const mocks = vi.hoisted(() => ({
  checkoutPair: vi.fn(),
  toast: vi.fn(),
}))

vi.mock('sanity', async (importOriginal) => ({
  ...(await importOriginal()),
  useDocumentStore: () => ({checkoutPair: mocks.checkoutPair}),
}))
vi.mock(
  'sanity/_dangerously_use_private_internals_that_do_not_follow_semver',
  async (importOriginal) => ({
    ...(await importOriginal()),
    getIdPair: (id: string) => ({publishedId: id, draftId: `drafts.${id}`}),
  }),
)
vi.mock('sanity/i18n', async (importOriginal) => ({
  ...(await importOriginal()),
  useTranslation: () => ({t: (key: string) => key}),
}))
vi.mock('@sanity/ui/toast', async (importOriginal) => ({
  ...(await importOriginal()),
  useToast: () => ({push: mocks.toast}),
}))

const defaults = {
  datasets: ['production'],
  defaultDataset: 'production',
  defaultApiVersion: '2025-02-19',
}
const runnerStub = createMachine({id: 'runnerStub'})

type Doc = Record<string, unknown>

/**
 * The published version of a checked out pair, as the document store's buffer behaves for
 * these edits: local edits apply at once, a collaborator's arrive as remote mutations
 */
function createDocument(initial: Doc) {
  let doc: Doc | null = initial
  const events = new Subject<unknown>()
  const commitError$ = new Subject<{error: unknown}>()
  const published = {
    events: defer(() => events.pipe(startWith({type: 'snapshot', document: doc}))),
    consistency$: of(true),
    patch: (patches: unknown[]) => patches,
    mutate: vi.fn((patches: {set: Doc}[]) => {
      doc = Object.assign({}, doc, ...patches.map((patch) => patch.set))
      events.next({type: 'mutation', origin: 'local', document: doc, mutations: patches})
    }),
    commit: vi.fn(),
  }
  mocks.checkoutPair.mockReturnValue({published, commitError$})
  return {
    published,
    commitError$,
    doc: () => doc,
    remoteEdit: (set: Doc) => {
      doc = {...doc, ...set}
      events.next({type: 'mutation', origin: 'remote', document: doc, mutations: []})
    },
  }
}

/** An editor that hands its content to the tab right away, as the query editor does */
function createEditor(read: () => string, write: (content: string) => void) {
  let content = read()
  const handle = {
    getContent: () => content,
    applyRemoteContent: vi.fn((next: string) => {
      content = next
      write(next)
    }),
    type: (next: string) => {
      content = next
      write(next)
    },
  }
  return {ref: {current: handle as unknown as VisionCodeMirrorHandle}, handle}
}

function setup(tab: Partial<VisionTab> = {}) {
  const initial = createInitialState(defaults)
  const persisted = {...initial, tabs: [{...initial.tabs[0], sharedId: 'shared-1', ...tab}]}
  const actor = createActor(visionMachine.provide({actors: {queryRunner: runnerStub as never}}), {
    input: {projectId: 'proj', persisted, defaults},
  })
  actor.start()
  const tabId = persisted.tabs[0].id
  const readTab = () => actor.getSnapshot().context.tabs.find((it) => it.id === tabId)!
  const query = createEditor(
    () => readTab().query,
    (next) => actor.send({type: 'tab.setQuery', id: tabId, query: next}),
  )
  // Params typed into the editor reach the tab only when the debounce runs
  const params = createEditor(
    () => readTab().rawParams,
    () => undefined,
  )
  const wrapper = ({children}: {children: ReactNode}) => (
    <VisionActorContext value={actor}>{children}</VisionActorContext>
  )
  const hook = renderHook(
    ({sharedId}: {sharedId: string | undefined}) =>
      useSharedTabSync({
        tabId,
        sharedId,
        queryEditorRef: query.ref as RefObject<VisionCodeMirrorHandle | null>,
        paramsEditorRef: params.ref as RefObject<VisionCodeMirrorHandle | null>,
        buildUrl: (q) => `https://example.invalid/?query=${encodeURIComponent(q)}`,
      }),
    {wrapper, initialProps: {sharedId: 'shared-1' as string | undefined}},
  )
  return {actor, tabId, readTab, query: query.handle, params: params.handle, hook}
}

describe('useSharedTabSync', () => {
  beforeEach(() => {
    mocks.checkoutPair.mockReset()
    mocks.toast.mockReset()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows the shared query as its document holds it when the tab is shown', () => {
    createDocument({query: '*[_type == "post"]', params: '{"limit": 3}', title: 'Posts'})
    const {readTab, query} = setup({query: 'stale'})

    expect(readTab().query).toBe('*[_type == "post"]')
    expect(readTab().rawParams).toBe('{"limit": 3}')
    expect(query.applyRemoteContent).toHaveBeenCalledWith('*[_type == "post"]')
  })

  it('sends an edit of the tab as a patch of the document, and saves it', () => {
    const document = createDocument({query: '*', params: '{}'})
    const {actor, tabId} = setup({query: '*', rawParams: '{}'})

    act(() => actor.send({type: 'tab.setQuery', id: tabId, query: '*[0]'}))

    expect(document.published.mutate).toHaveBeenCalledWith([
      {set: {query: '*[0]', url: 'https://example.invalid/?query=*%5B0%5D'}},
    ])
    expect(document.published.commit).toHaveBeenCalled()
    expect(document.doc()?.query).toBe('*[0]')
  })

  it("merges a collaborator's edit into the editors, keeping what the user typed but has not sent", () => {
    const document = createDocument({query: '*[_type == "post"]', params: '{"limit": 3}'})
    const {readTab, query, params} = setup({query: '*[_type == "post"]', rawParams: '{"limit": 3}'})

    // Typed into the params editor, still in the debounce
    params.type('{"type": "post", "limit": 3}')
    act(() => document.remoteEdit({query: '*[_type == "article"]', params: '{"limit": 5}'}))

    expect(query.applyRemoteContent).toHaveBeenLastCalledWith('*[_type == "article"]')
    expect(readTab().query).toBe('*[_type == "article"]')
    expect(params.applyRemoteContent).toHaveBeenLastCalledWith('{"type": "post", "limit": 5}')
    expect(readTab().rawParams).toBe('{"type": "post", "limit": 5}')
    // The merged params hold the user's edit, which is sent on
    expect(document.published.mutate).toHaveBeenLastCalledWith([
      expect.objectContaining({
        set: expect.objectContaining({params: '{"type": "post", "limit": 5}'}),
      }),
    ])
  })

  it("takes a collaborator's options and title", () => {
    const options = createInitialState(defaults).tabs[0].options
    const document = createDocument({query: '*', params: '{}', options: toStoredOptions(options)})
    const {readTab} = setup({query: '*', rawParams: '{}'})

    act(() =>
      document.remoteEdit({
        options: toStoredOptions({...options, perspective: 'drafts'}),
        title: 'Renamed',
      }),
    )

    expect(readTab().options.perspective).toBe('drafts')
    expect(readTab().title).toBe('Renamed')
    expect(document.published.mutate).not.toHaveBeenCalled()
  })

  it('writes nothing for a document shared before tabs were edited together until the tab changes', () => {
    const document = createDocument({url: 'https://example.invalid/'})
    const {actor, tabId} = setup({query: '*', rawParams: '{}'})

    act(() => document.remoteEdit({title: 'Renamed'}))
    expect(document.published.mutate).not.toHaveBeenCalled()

    act(() => actor.send({type: 'tab.setOptions', id: tabId, options: {useCdn: true}}))
    expect(document.published.mutate).toHaveBeenCalledWith([
      {set: expect.objectContaining({options: expect.objectContaining({useCdn: true})})},
    ])
  })

  it('tells the user when an edit could not be saved', () => {
    const document = createDocument({query: '*', params: '{}'})
    setup({query: '*', rawParams: '{}'})

    act(() => document.commitError$.next({error: new Error('Forbidden')}))

    expect(mocks.toast).toHaveBeenCalledWith(
      expect.objectContaining({status: 'error', title: 'vision.tabs.sync-failed'}),
    )
  })

  it('saves the last edits when it stops syncing, and checks nothing out without a shared query', () => {
    const document = createDocument({query: '*', params: '{}'})
    const {hook} = setup({query: '*', rawParams: '{}'})
    document.published.commit.mockClear()

    hook.rerender({sharedId: undefined})

    expect(document.published.commit).toHaveBeenCalledTimes(1)
    expect(mocks.checkoutPair).toHaveBeenCalledTimes(1)
  })

  it('does nothing while the document is not loaded', () => {
    mocks.checkoutPair.mockReturnValue({
      published: {
        events: NEVER,
        consistency$: of(true),
        patch: (patches: unknown[]) => patches,
        mutate: vi.fn(),
        commit: vi.fn(),
      },
      commitError$: NEVER,
    })
    const {actor, tabId} = setup({query: '*'})

    act(() => actor.send({type: 'tab.setQuery', id: tabId, query: '*[0]'}))

    expect(mocks.checkoutPair.mock.results[0].value.published.mutate).not.toHaveBeenCalled()
  })
})
