import {BehaviorSubject, type Observable} from 'rxjs'

export interface BroadcastedState<T> {
  value: Observable<T | undefined>
  get(): T | undefined
  update(value: T | undefined): void
  dispose(): void
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

export function createBroadcastState(key: string): BroadcastedState<void>
export function createBroadcastState<T>(
  key: string,
  initial: (current: T | undefined) => T | undefined,
): BroadcastedState<T>
export function createBroadcastState<T>(
  key: string,
  initial: (current: T | undefined) => T | undefined,
  storage: BroadcastedStateStorage<T>,
): BroadcastedState<T>
export function createBroadcastState<T>(
  key: string,
  initial?: (current: T | undefined) => T | undefined,
  storage: BroadcastedStateStorage<T> = createMemoryStorage(),
): BroadcastedState<T> {
  const channel = new BroadcastChannel(key)
  const subject = new BehaviorSubject<T | undefined>(initial?.(storage.load()))

  storage.store(subject.getValue())

  channel.onmessage = (e: MessageEvent<string>) => {
    const parsed = JSON.parse(e.data)
    subject.next(parsed === null ? undefined : parsed)
  }

  return {
    value: subject.asObservable(),
    get: () => subject.getValue(),
    update(value: T | undefined) {
      storage.store(value)
      const stringified = JSON.stringify(value === undefined ? null : value)
      channel.postMessage(stringified)
      subject.next(value)
    },
    dispose() {
      channel.close()
      subject.complete()
    },
  }
}
