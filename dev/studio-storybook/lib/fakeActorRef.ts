/**
 * A fake XState actor ref, for components that READ a machine's state to render.
 *
 * ## Why this is allowed
 *
 * The standing rule (Faheem, 2026-07-26): stub a context or dependency when the component reads
 * it as **input**; refuse when the thing being stubbed **is** what the story is testing.
 *
 * `PreviewHeader` is squarely the first kind. It is a toolbar. Its job is laying out a URL field,
 * a viewport toggle, an overlay toggle and a refresh button, and reflecting connection state in
 * them. The Presentation state machine is the *input* it reflects - the machine's own transitions
 * are tested by the machine's own tests, not by a toolbar story. Faking the actor lets a story pin
 * "what does the toolbar look like while reloading", which is the question the toolbar answers and
 * which is otherwise unreachable without a live iframe and a comlink connection.
 *
 * What would NOT be allowed under the same rule: faking the machine and then storying the machine's
 * behaviour, or faking `useDocumentPane` for a banner whose entire job is deciding whether to
 * appear. In both of those the fixture would be answering the question the story claims to ask.
 *
 * ## What `useSelector` actually needs
 *
 * `@xstate/react`'s `useSelector` wants an actor with `getSnapshot()` and `subscribe()`. The
 * snapshot has to answer whatever the selectors ask of it. `PreviewHeader` asks for exactly three
 * things, which is the whole surface this file has to satisfy:
 *
 *   state.matches('loading')            -> a string state
 *   state.matches({loaded: 'reloading'}) -> a NESTED state, expressed as an object
 *   state.context.<field>                -> plain context
 *   state.hasTag('busy')                 -> tags (the preview-url machine)
 *
 * The snapshot here is static: `subscribe` registers the callback and never emits, because these
 * stories pin one state each rather than driving transitions. A story that needs a transition
 * should use {@link createControllableActorRef} and push a new snapshot.
 */

export interface FakeStateOptions {
  /**
   * The state value, in XState's own shape: `'loading'` for a flat state, or
   * `{loaded: 'reloading'}` for a nested one. `matches` compares against this.
   */
  value?: string | Record<string, string>
  context?: Record<string, unknown>
  tags?: string[]
}

function matchesValue(current: string | Record<string, string>, query: unknown): boolean {
  if (typeof query === 'string') {
    // A string query matches a flat state of the same name, and also matches the PARENT of a
    // nested state - `matches('loaded')` is true while the machine is in `{loaded: 'reloading'}`.
    // Getting this wrong makes a toolbar story silently show the wrong buttons.
    if (typeof current === 'string') return current === query
    return Object.keys(current)[0] === query
  }
  if (typeof query === 'object' && query !== null) {
    if (typeof current === 'string') return false
    return Object.entries(query as Record<string, string>).every(
      ([key, child]) => current[key] === child,
    )
  }
  return false
}

export function createFakeSnapshot({value = 'idle', context = {}, tags = []}: FakeStateOptions) {
  return {
    value,
    context,
    tags: new Set(tags),
    matches: (query: unknown) => matchesValue(value, query),
    hasTag: (tag: string) => tags.includes(tag),
    can: () => false,
    status: 'active' as const,
  }
}

/** A static actor ref pinned to one state. Sends are recorded and otherwise ignored. */
export function createFakeActorRef(options: FakeStateOptions = {}) {
  const snapshot = createFakeSnapshot(options)
  const sent: unknown[] = []
  return {
    sent,
    getSnapshot: () => snapshot,
    subscribe: () => ({unsubscribe: () => undefined}),
    send: (event: unknown) => {
      sent.push(event)
    },
    id: 'fake-actor',
  }
}

/**
 * An actor ref whose snapshot can be replaced, so a story can drive a transition.
 *
 * Use this when the story is about the toolbar CHANGING - idle to reloading, say - rather than
 * about how it looks in one state. `set` notifies subscribers the way a real actor would, so
 * `useSelector` re-renders.
 */
export function createControllableActorRef(initial: FakeStateOptions = {}) {
  let snapshot = createFakeSnapshot(initial)
  const listeners = new Set<(value: ReturnType<typeof createFakeSnapshot>) => void>()
  const sent: unknown[] = []

  return {
    sent,
    getSnapshot: () => snapshot,
    subscribe: (listener: unknown) => {
      const fn =
        typeof listener === 'function'
          ? (listener as (v: ReturnType<typeof createFakeSnapshot>) => void)
          : (listener as {next?: (v: ReturnType<typeof createFakeSnapshot>) => void}).next
      if (fn) listeners.add(fn)
      return {unsubscribe: () => (fn ? listeners.delete(fn) : undefined)}
    },
    send: (event: unknown) => {
      sent.push(event)
    },
    /** Replace the snapshot and notify subscribers. */
    set: (next: FakeStateOptions) => {
      snapshot = createFakeSnapshot(next)
      listeners.forEach((listener) => listener(snapshot))
    },
    id: 'fake-actor',
  }
}

/**
 * The two actors `PreviewHeader` reads, in the states worth storying.
 *
 * Named after what an editor would see rather than after machine states, because that is what a
 * story is about: `loading` is the blank iframe before the front end answers, `reloading` is the
 * spinner on the refresh button, `busy` is the preview-url machine about to swap target origin.
 */
export const presentationActorStates = {
  loading: {value: 'loading', context: {visualEditingOverlaysEnabled: false}},
  loaded: {value: 'loaded', context: {visualEditingOverlaysEnabled: false}},
  loadedWithOverlays: {value: 'loaded', context: {visualEditingOverlaysEnabled: true}},
  refreshing: {
    value: {loaded: 'refreshing'},
    context: {visualEditingOverlaysEnabled: false},
  },
  reloading: {value: {loaded: 'reloading'}, context: {visualEditingOverlaysEnabled: false}},
} satisfies Record<string, FakeStateOptions>

/**
 * The preview-url machine's context carries two things the toolbar will THROW without, and neither
 * is visible from the component's own props:
 *
 *   allowOrigins  `useAllowPatterns` -> TypeError: allowPatterns must be an array
 *   previewUrl    `useTargetOrigin`  -> TypeError: targetOrigin is required
 *
 * Both surfaced one at a time, each behind the other, which is the usual shape of this work: the
 * first throw unwinds the render before the second consumer ever executes. Worth noting that an
 * EMPTY `allowOrigins` array is a legitimate state (no origin permitted yet) while a missing one
 * is a crash - so the distinction the component draws is between "none" and "unconfigured".
 */
const previewUrlContext = {
  allowOrigins: [/^https:\/\/example\.com/],
  // `useTargetOrigin` reads `context.previewUrl?.origin` and throws `targetOrigin is required`
  // without it. Note it wants a real URL object, not a string - `.origin` is the property.
  previewUrl: new URL('https://example.com/blog/hello'),
}

export const previewUrlActorStates = {
  idle: {value: 'idle', tags: [], context: previewUrlContext},
  busy: {value: 'resolving', tags: ['busy'], context: previewUrlContext},
  /** No permitted origins - the state a studio is in before any preview URL is configured. */
  noOriginsAllowed: {
    value: 'idle',
    tags: [],
    context: {...previewUrlContext, allowOrigins: []},
  },
} satisfies Record<string, FakeStateOptions>
