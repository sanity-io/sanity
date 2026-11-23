import {BehaviorSubject, type Observable} from 'rxjs'

export interface BroadcastedState<T> {
  value: Observable<T | undefined>
  get(): T | undefined
  update(value: T | undefined): void
  dispose(): void
}

export interface BroadcastedStateOptions<T> {
  /**
   * Whether to take over a value another tab broadcast. A refused value is cleared, here, in
   * storage and in every other tab.
   */
  accept?: (value: T) => boolean
}

export interface BroadcastedStateStorage<T> {
  load(): T | undefined
  store(value: T | undefined): void
}

export function createLocalStorageStorage<T>(key: string): BroadcastedStateStorage<T> {
  function load(): T | undefined {
    try {
      const value = localStorage.getItem(key)
      if (value === null) return undefined
      return JSON.parse(value)
    } catch (err) {
      console.error(`Failed to parse localstorage value: ${err.message}`)
      return undefined
    }
  }

  function store(value: T | undefined) {
    try {
      if (value === undefined) {
        localStorage.removeItem(key)
      } else {
        localStorage.setItem(key, JSON.stringify(value))
      }
    } catch (err) {
      console.error(`Failed to persist localstorage value: ${err.message}`)
    }
  }

  return {load, store}
}

export function createMemoryStorage<T>(): BroadcastedStateStorage<T> {
  const storage = Object.create(null)

  function load(): T | undefined {
    return 'value' in storage ? storage.value : undefined
  }

  function store(value: T | undefined) {
    if (value === undefined) {
      delete storage.value
    } else {
      storage.value = value
    }
  }

  return {load, store}
}

// `BroadcastChannel` is browser-only. In SSR (Next.js App Router, etc.) the
// auth store is constructed during workspace evaluation on the server, where
// the global is undefined. Fall back to a no-op channel so construction is
// safe; cross-tab sync is meaningless on the server anyway.
function createChannel(key: string): Pick<BroadcastChannel, 'postMessage' | 'close' | 'onmessage'> {
  if (typeof BroadcastChannel === 'undefined') {
    return {postMessage: () => {}, close: () => {}, onmessage: null}
  }
  return new BroadcastChannel(key)
}

export function createBroadcastState(key: string): BroadcastedState<void>
export function createBroadcastState<T>(
  key: string,
  initial: (current: T | undefined) => T | undefined,
): BroadcastedState<T>
export function createBroadcastState<T>(
  key: string,
  initial: (current: T | undefined) => T | undefined,
  storage: BroadcastedStateStorage<T>,
  options?: BroadcastedStateOptions<T>,
): BroadcastedState<T>
export function createBroadcastState<T>(
  key: string,
  initial?: (current: T | undefined) => T | undefined,
  storage: BroadcastedStateStorage<T> = createMemoryStorage(),
  options: BroadcastedStateOptions<T> = {},
): BroadcastedState<T> {
  const channel = createChannel(key)
  const subject = new BehaviorSubject<T | undefined>(initial?.(storage.load()))

  storage.store(subject.getValue())

  function update(value: T | undefined) {
    storage.store(value)
    const stringified = JSON.stringify(value === undefined ? null : value)
    channel.postMessage(stringified)
    subject.next(value)
  }

  channel.onmessage = (e: MessageEvent<string>) => {
    const parsed = JSON.parse(e.data)
    if (parsed === null) {
      subject.next(undefined)
      return
    }
    // A refused value is not taken over, and cleared for every tab.
    if (options.accept && !options.accept(parsed)) {
      update(undefined)
      return
    }
    subject.next(parsed)
  }

  return {
    value: subject.asObservable(),
    get: () => subject.getValue(),
    update,
    dispose() {
      channel.close()
      subject.complete()
    },
  }
}
