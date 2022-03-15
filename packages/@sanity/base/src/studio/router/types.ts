export interface RouterErrorEvent {
  type: 'error'
  error: Error
}

export interface RouterStateEvent {
  type: 'state'
  state: Record<string, unknown> // | null
  isNotFound: boolean
}

export interface RouterIntentEvent {
  type: 'intent'
  intent: {name: string; params: Record<string, unknown>}
  isNotFound: boolean
}

export type RouterEvent = RouterErrorEvent | RouterStateEvent | RouterIntentEvent
