/**
 * Test setup for the Portable Text sync fuzz test.
 *
 * Connects `PortableTextInput` (through `FormBuilder`) to the real document
 * store code (`createObservableBufferedDocument`, which `checkoutPair` also
 * uses) and to a fake server. The fake server only sends listener events and
 * confirms commits when the test tells it to. That way the test decides the
 * order of local edits, remote edits, commits and listener events, and can
 * replay and shrink any order it tried.
 */
import {type Editor, useEditor} from '@portabletext/editor'
import {type SanityClient} from '@sanity/client'
import {Mutation} from '@sanity/mutator'
import {
  defineArrayMember,
  defineField,
  defineType,
  type ObjectSchemaType,
  type PortableTextBlock,
  type SanityDocument,
} from '@sanity/types'
// oxlint-disable-next-line testing-library/no-manual-cleanup -- one test mounts hundreds of harnesses, one per fuzz run
import {act, cleanup, render} from '@testing-library/react'
import {useEffect, useMemo, useState} from 'react'
import {Subject} from 'rxjs'
import {tap} from 'rxjs/operators'
import {vi} from 'vitest'

import {createMockSanityClient} from '../../../../../../../test/mocks/mockSanityClient'
import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {ChangeIndicatorsTracker} from '../../../../../changeIndicators/tracker'
import {useSchema} from '../../../../../hooks/useSchema'
import {
  type CommitRequest,
  createObservableBufferedDocument,
} from '../../../../../store/document/buffered-doc/createObservableBufferedDocument'
import {
  type DocumentMutationEvent,
  type DocumentRebaseEvent,
  type MutationPayload,
} from '../../../../../store/document/buffered-doc/types'
import {type ListenerEvent} from '../../../../../store/document/getPairListener'
import {type MutationEvent} from '../../../../../store/document/types'
import {EMPTY_ARRAY} from '../../../../../util/empty'
import {createPatchChannel, type PatchMsg} from '../../../../patch/PatchChannel'
import {type PatchEvent} from '../../../../patch/PatchEvent'
import {useFormState} from '../../../../store/useFormState'
import {FormBuilder} from '../../../../studio/FormBuilder'
import {type PortableTextPluginsProps} from '../../../../types/blockProps'
import {type FormDocumentValue} from '../../../../types/formDocumentValue'
import {fromMutationPatches, toMutationPatches} from '../../../../utils/mutationPatch'

export const DOCUMENT_ID = 'drafts.fuzz'
export const FIELD = 'body'

/**
 * Normalizes a field value for comparison. The Studio treats a missing field
 * and an empty array alike, and PTE represents an empty value as a single
 * placeholder text block with an empty span (a fresh key every time), which it
 * never writes to the document on its own.
 */
export function normalizeValue(value: PortableTextBlock[] | undefined): PortableTextBlock[] {
  if (!value || value.length === 0) return []
  if (value.length === 1) {
    const [block] = value
    const children = block.children as Array<{_type: string; text?: string}> | undefined
    const isPlaceholder =
      block._type === 'block' &&
      (block.style === undefined || block.style === 'normal') &&
      block.listItem === undefined &&
      children?.length === 1 &&
      children[0]._type === 'span' &&
      !children[0].text
    if (isPlaceholder) return []
  }
  return value
}

/**
 * How often each kind of document event reached the form, across all runs.
 * Printed at the end, so you can see whether the runs reached the tricky
 * cases (rebases in particular) and didn't only pass.
 */
export const coverage = {
  localMutationEvents: 0,
  remoteMutationEvents: 0,
  rebaseEvents: 0,
  remotePatchesForwarded: 0,
}

/**
 * The last editor instance mounted by the harness. PTE only hands out the
 * `Editor` to its own plugins, so a schema-level plugin component captures it.
 */
let capturedEditor: Editor | null = null

/** The real `setTimeout`, captured before any test installs fake timers. */
const realSetTimeout = globalThis.setTimeout

function CaptureEditorPlugin() {
  const editor = useEditor()
  useEffect(() => {
    capturedEditor = editor
    return () => {
      if (capturedEditor === editor) capturedEditor = null
    }
  }, [editor])
  return null
}

function FuzzPlugins(props: PortableTextPluginsProps) {
  return (
    <>
      {props.renderDefault(props)}
      <CaptureEditorPlugin />
    </>
  )
}

const schemaTypes = [
  defineType({
    name: 'test',
    type: 'document',
    fields: [
      defineField({
        name: FIELD,
        type: 'array',
        of: [
          defineArrayMember({
            type: 'block',
            styles: [
              {title: 'Normal', value: 'normal'},
              {title: 'H1', value: 'h1'},
            ],
            lists: [{title: 'Bullet', value: 'bullet'}],
            marks: {
              decorators: [
                {title: 'Strong', value: 'strong'},
                {title: 'Emphasis', value: 'em'},
              ],
              annotations: [
                defineArrayMember({
                  name: 'link',
                  type: 'object',
                  fields: [defineField({name: 'href', type: 'string'})],
                }),
              ],
            },
            of: [
              defineArrayMember({
                name: 'mention',
                type: 'object',
                fields: [defineField({name: 'name', type: 'string'})],
              }),
            ],
          }),
        ],
        components: {portableText: {plugins: FuzzPlugins}},
      }),
    ],
  }),
]

/**
 * Mirrors `prepareMutationEvent` / `prepareRebaseEvent` in the structure
 * tool's `FormView`, which is how the Studio forwards document store events to
 * form inputs through the patch channel.
 */
function prepareMutationEvent(event: DocumentMutationEvent): PatchMsg {
  const patches = event.mutations.map((mut) => mut.patch).filter(Boolean)
  return {
    type: 'mutation',
    snapshot: event.document,
    patches: fromMutationPatches(event.origin, patches),
  }
}

function prepareRebaseEvent(event: DocumentRebaseEvent): PatchMsg {
  const remotePatches = event.remoteMutations.map((mut) => mut.patch).filter(Boolean)
  const localPatches = event.localMutations.map((mut) => mut.patch).filter(Boolean)
  return {
    type: 'rebase',
    snapshot: event.document,
    patches: fromMutationPatches('remote', remotePatches).concat(
      fromMutationPatches('local', localPatches),
    ),
  }
}

/**
 * Fake Content Lake for one document. Commits from the Studio and edits from
 * a simulated second client are applied to `head` immediately, but the
 * resulting listener events wait in `pendingListenerEvents` until the test
 * delivers them. That lets the Studio fall far behind the server.
 */
export class FakeServer {
  head: SanityDocument
  pendingCommits: CommitRequest[] = []
  pendingListenerEvents: MutationEvent[] = []
  private revCounter = 0

  constructor(initial: SanityDocument) {
    this.head = initial
  }

  nextRev(): string {
    this.revCounter += 1
    return `rev-${this.revCounter}`
  }

  /** Applies a mutation from any client and queues its listener event. */
  private applyMutation(
    mutations: MutationPayload[],
    transactionId: string,
    resultRev: string,
  ): void {
    const previousRev = this.head._rev
    const next = new Mutation({mutations, transactionId, resultRev}).apply(this.head)
    if (!next) throw new Error('Fuzz documents are never deleted')
    this.head = next as SanityDocument
    this.pendingListenerEvents.push({
      type: 'mutation',
      documentId: DOCUMENT_ID,
      transactionId,
      effects: {revert: [], apply: []},
      mutations,
      previousRev,
      resultRev,
      messageReceivedAt: '2026-01-01T00:00:00.000Z',
      transition: 'update',
      transactionCurrentEvent: 1,
      transactionTotalEvents: 1,
      visibility: 'transaction',
    } satisfies MutationEvent)
  }

  /** Accepts the oldest pending commit from the Studio. */
  acceptCommit(): boolean {
    const request = this.pendingCommits.shift()
    if (!request) return false
    const {mutation} = request
    this.applyMutation(
      mutation.mutations as MutationPayload[],
      mutation.transactionId!,
      mutation.resultRev ?? mutation.transactionId!,
    )
    request.success()
    return true
  }

  /** An edit from another client, applied against the server's current head. */
  remoteMutate(mutations: MutationPayload[]): void {
    const rev = this.nextRev()
    this.applyMutation(mutations, rev, rev)
  }
}

/**
 * Another client editing the same document, like a second person in another
 * Studio. It works on its own copy (`view`), which only catches up with the
 * server when told to, and holds its edits until it sends them. Two of these
 * can edit from views that are out of date with each other, so their edits
 * cross on the server.
 */
export class RemoteClient {
  view: SanityDocument
  private pending: Array<{mutations: MutationPayload[]; inserted: string}> = []

  constructor(private readonly server: FakeServer) {
    this.view = server.head
  }

  /** Applies an edit to this client's own copy and holds it until `send`. */
  edit(mutations: MutationPayload[], inserted: string): void {
    const next = new Mutation({mutations}).apply(this.view)
    if (next) this.view = next as SanityDocument
    this.pending.push({mutations, inserted})
  }

  /** Sends the held edits to the server. Returns the text they inserted. */
  send(): string {
    let inserted = ''
    for (const edit of this.pending) {
      this.server.remoteMutate(edit.mutations)
      inserted += edit.inserted
    }
    this.pending = []
    return inserted
  }

  /**
   * Replaces this client's copy with the server's latest, then reapplies the
   * client's unsent edits on top, like a real client rebasing.
   */
  catchUp(): void {
    let view: SanityDocument = this.server.head
    for (const edit of this.pending) {
      const next = new Mutation({mutations: edit.mutations}).apply(view)
      if (next) view = next as SanityDocument
    }
    this.view = view
  }
}

export interface Harness {
  server: FakeServer
  /** Two other clients editing the same document. */
  remoteClients: [RemoteClient, RemoteClient]
  editor: () => Editor
  /** Whether the editor is mounted. PTE unmounts it when it rejects a value as invalid. */
  editorMounted: () => boolean
  /** The value the form (and so the document store) holds for the field. */
  formValue: () => PortableTextBlock[] | undefined
  /** The value the editor holds internally. */
  editorValue: () => PortableTextBlock[] | undefined
  /**
   * The error that stopped the Studio from forwarding document events to the
   * form, if any (see `FormView`).
   */
  forwardingError: () => unknown
  /** Delivers the oldest queued listener event to the Studio. */
  deliverListenerEvent: () => boolean
  /** Asks the buffered document to send its pending local mutations. */
  commit: () => void
  /** Runs pending React work and microtasks, and moves the fake clock forward by `ms`. */
  advance: (ms: number) => Promise<void>
  /**
   * Runs until nothing changes. Each round lets PTE send its batched changes,
   * commits, accepts every commit and delivers every listener event. It stops
   * after a round that changes nothing.
   */
  settle: () => Promise<void>
  unmount: () => void
}

export type FuzzTestProvider = Awaited<ReturnType<typeof createTestProvider>>

export function createFuzzTestProvider(): Promise<FuzzTestProvider> {
  return createTestProvider({
    client: createMockSanityClient() as unknown as SanityClient,
    config: {name: 'default', projectId: 'test', dataset: 'test', schema: {types: schemaTypes}},
  })
}

/**
 * Mounts the Studio form around `initialBody`, with fake timers from the
 * start. With `undefined`, the document has no value for the field, like a
 * new document. Once it returns, time only moves through `advance` and
 * `settle`. Call `unmount` to restore real timers.
 */
export async function createHarness(
  initialBody: PortableTextBlock[] | undefined,
  TestProvider: FuzzTestProvider,
): Promise<Harness> {
  const initial: SanityDocument = {
    _id: DOCUMENT_ID,
    _type: 'test',
    _rev: 'rev-0',
    _createdAt: '2026-01-01T00:00:00.000Z',
    _updatedAt: '2026-01-01T00:00:00.000Z',
    ...(initialBody === undefined ? {} : {[FIELD]: initialBody}),
  }
  const server = new FakeServer(initial)
  const remoteClients: [RemoteClient, RemoteClient] = [
    new RemoteClient(server),
    new RemoteClient(server),
  ]
  const listenerEvent$ = new Subject<ListenerEvent>()
  const buffered = createObservableBufferedDocument(listenerEvent$)
  const patchChannel = createPatchChannel()

  let localDocument: SanityDocument | null = null
  const documentListeners = new Set<(doc: SanityDocument | null) => void>()

  const subscription = buffered.updates$.subscribe({
    next: (event) => {
      if (event.type === 'snapshot') {
        localDocument = event.document as SanityDocument | null
        documentListeners.forEach((listener) => listener(localDocument))
      }
    },
    // The forwarding subscription below records the error. Without a handler
    // here, rxjs would throw it from a (fake) timer, and the next clock tick
    // would fail the run with the raw error before `forwardingError` is read.
    error: () => undefined,
  })

  // Mirrors `FormView`, including its use of `tap`. This stream errors, and the
  // Studio stops forwarding document events to the form for the rest of the
  // session, when an input throws while handling a patch, or when a local
  // patch from the input cannot be applied (`BufferedDocument.add` throws
  // inside the buffered document's own `tap`).
  let forwardingError: unknown
  const forwardingSubscription = buffered.updates$
    .pipe(
      tap((event) => {
        if (event.type === 'mutation') {
          const message = prepareMutationEvent(event)
          if (event.origin === 'remote') {
            coverage.remoteMutationEvents += 1
            coverage.remotePatchesForwarded += message.patches.length
          } else {
            coverage.localMutationEvents += 1
          }
          patchChannel.publish(message)
        }
        if (event.type === 'rebase') {
          const message = prepareRebaseEvent(event)
          coverage.rebaseEvents += 1
          coverage.remotePatchesForwarded += message.patches.filter(
            (patch) => patch.origin === 'remote',
          ).length
          patchChannel.publish(message)
        }
      }),
    )
    .subscribe({
      error: (error) => {
        forwardingError = error
      },
    })
  const commitSubscription = buffered.commitRequest$.subscribe((request) => {
    server.pendingCommits.push(request)
  })

  const teardown = () => {
    // `cleanup` rather than `unmount`: testing-library keeps every container
    // until cleanup, which would otherwise only run after the whole test, not
    // after each run.
    cleanup()
    subscription.unsubscribe()
    forwardingSubscription.unsubscribe()
    commitSubscription.unsubscribe()
    vi.useRealTimers()
  }

  listenerEvent$.next({type: 'snapshot', documentId: DOCUMENT_ID, document: initial})

  // Mirrors `useDocumentForm`'s `onChange` → `patch.execute` → `draft.patch`.
  const handleChange = (event: PatchEvent) => {
    buffered.addMutations(
      toMutationPatches(event.patches).map((patch) => ({patch: {...patch, id: DOCUMENT_ID}})),
    )
  }

  function Studio() {
    const [document, setDocument] = useState(localDocument)
    useEffect(() => {
      documentListeners.add(setDocument)
      return () => {
        documentListeners.delete(setDocument)
      }
    }, [])

    const schema = useSchema()
    const schemaType = schema.get('test') as ObjectSchemaType
    const formState = useFormState({
      schemaType,
      documentValue: document,
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

    const noop = useMemo(() => () => undefined, [])
    if (!formState) return null

    return (
      <FormBuilder
        __internal_patchChannel={patchChannel}
        changed={false}
        changesOpen={false}
        collapsedFieldSets={undefined}
        collapsedPaths={undefined}
        focused={formState.focused}
        focusPath={formState.focusPath}
        groups={formState.groups}
        hasUpstreamVersion={false}
        hasBaseVariant={false}
        id="root"
        members={formState.members}
        onChange={handleChange}
        onFieldGroupSelect={noop}
        onPathBlur={noop}
        onPathFocus={noop}
        onPathOpen={noop}
        onSetFieldSetCollapsed={noop}
        onSetPathCollapsed={noop}
        openPath={EMPTY_ARRAY}
        presence={EMPTY_ARRAY}
        schemaType={formState.schemaType}
        validation={EMPTY_ARRAY}
        value={formState.value as FormDocumentValue}
      />
    )
  }

  // Fake timers go in before the mount, so every timer the Studio and PTE set
  // is on the fake clock. A timer set on the real clock could fire between
  // steps, and the steps alone would no longer decide the order of events.
  vi.useFakeTimers({toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date']})

  capturedEditor = null
  async function mount() {
    // oxlint-disable-next-line testing-library/no-unnecessary-act -- the form suspends while it lazy-loads, which needs an awaited async act around the mount
    await act(async () => {
      render(
        <TestProvider>
          {/* The document pane provides this around the form in the Studio. */}
          <ChangeIndicatorsTracker>
            <Studio />
          </ChangeIndicatorsTracker>
        </TestProvider>,
      )
    })

    // The Studio lazy-loads parts of the form, so the editor mounts a few real
    // event loop turns after the first render. It then briefly holds a
    // placeholder block until the initial value has synced in; the input is
    // read-only until then, so wait for the sync before the test starts. Each
    // turn moves the fake clock a little and yields to the real event loop so
    // the lazy-loaded modules can arrive.
    const initialValueSynced = () =>
      capturedEditor !== null &&
      JSON.stringify(normalizeValue(capturedEditor.getSnapshot().context.value)) ===
        JSON.stringify(normalizeValue(initialBody))
    // Wait by real time (`Date` is faked), not a fixed number of turns: the
    // first mount in a process also waits for modules to compile.
    const mountDeadline = performance.now() + 15_000
    while (!initialValueSynced() && performance.now() < mountDeadline) {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(10)
        await new Promise((resolve) => realSetTimeout(resolve, 0))
      })
    }
    if (!initialValueSynced()) {
      throw new Error(
        `Editor never mounted with the initial value: ${document.body.innerHTML.slice(0, 2000)}`,
      )
    }

    // Run whatever the mount left scheduled, so every run starts from the same
    // idle state however long the mount took.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000)
    })
  }

  // Nothing gets a handle on a harness that failed to mount, so tear it down
  // here rather than leave fake timers and subscriptions running into the next
  // run.
  try {
    await mount()
  } catch (error) {
    teardown()
    throw error
  }

  const advance = async (ms: number) => {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(ms)
    })
  }

  const deliverListenerEvent = () => {
    const event = server.pendingListenerEvents.shift()
    if (!event) return false
    listenerEvent$.next(event)
    return true
  }

  const settle = async () => {
    let quietRounds = 0
    for (let round = 0; round < 50 && quietRounds < 2; round++) {
      // Longer than PTE's typing debounce, mutation flush interval and busy
      // retry, so batched editor mutations reach the form.
      await advance(1500)
      buffered.commit()
      await advance(0)
      let progressed = false
      while (server.acceptCommit()) progressed = true
      await advance(0)
      while (deliverListenerEvent()) {
        progressed = true
        await advance(0)
      }
      quietRounds = progressed ? 0 : quietRounds + 1
    }
    if (quietRounds < 2) throw new Error('System did not settle within 50 rounds')
  }

  return {
    server,
    remoteClients,
    editor: () => {
      if (!capturedEditor) throw new Error('Editor not mounted')
      return capturedEditor
    },
    editorMounted: () => capturedEditor !== null,
    formValue: () => localDocument?.[FIELD] as PortableTextBlock[] | undefined,
    editorValue: () => capturedEditor?.getSnapshot().context.value,
    forwardingError: () => forwardingError,
    deliverListenerEvent,
    commit: () => buffered.commit(),
    advance,
    settle,
    unmount: teardown,
  }
}
