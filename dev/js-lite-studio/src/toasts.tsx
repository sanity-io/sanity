/**
 * Toasts from outside React (the document store, presence), shown by the `@sanity/ui` toast
 * provider through a component that forwards them.
 */
import {useToast} from '@sanity/ui/toast'
import {useEffect} from 'react'

export interface ToastMessage {
  status: 'error' | 'warning' | 'success' | 'info'
  title: string
  description?: string
}

const listeners = new Set<(toast: ToastMessage) => void>()
const queued: ToastMessage[] = []

export function pushToast(toast: ToastMessage): void {
  if (listeners.size === 0) {
    queued.push(toast)
    return
  }
  for (const listener of listeners) listener(toast)
}

export function toastError(title: string, error: unknown): void {
  const description =
    error instanceof Error ? error.message : typeof error === 'string' ? error : undefined
  pushToast({status: 'error', title, description})
}

export function ToastBridge() {
  const toast = useToast()
  useEffect(() => {
    const listener = (message: ToastMessage) => toast.push({closable: true, ...message})
    listeners.add(listener)
    for (const message of queued.splice(0)) listener(message)
    return () => {
      listeners.delete(listener)
    }
  }, [toast])
  return null
}
