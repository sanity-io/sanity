/**
 * The reactivity the studio needs and nothing more: values that components subscribe to with
 * `useSyncExternalStore`, the counterpart of the Rust studio's signals.
 */
import {useSyncExternalStore} from 'react'

type Listener = () => void

export class Atom<T> {
  private value: T
  private listeners = new Set<Listener>()

  constructor(value: T) {
    this.value = value
  }

  get = (): T => this.value

  set(next: T): void {
    if (Object.is(next, this.value)) return
    this.value = next
    for (const listener of [...this.listeners]) listener()
  }

  update(change: (value: T) => T): void {
    this.set(change(this.value))
  }

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }
}

export function useAtom<T>(atom: Atom<T>): T {
  return useSyncExternalStore(atom.subscribe, atom.get, atom.get)
}

/** Change notifications by key: a document id, a query, a preview. */
export class Emitter {
  private listeners = new Map<string, Set<Listener>>()

  subscribe(key: string, listener: Listener): () => void {
    let set = this.listeners.get(key)
    if (!set) {
      set = new Set()
      this.listeners.set(key, set)
    }
    set.add(listener)
    return () => {
      set.delete(listener)
      if (set.size === 0) this.listeners.delete(key)
    }
  }

  emit(key: string): void {
    const set = this.listeners.get(key)
    if (!set) return
    for (const listener of [...set]) listener()
  }
}
