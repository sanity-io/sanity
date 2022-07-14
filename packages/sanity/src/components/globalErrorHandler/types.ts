export interface GlobalErrorMessage {
  error: Error | null
  params: {
    colno: number
    lineno: number
    error: Error
    event: ErrorEvent | string
    source?: string
  }
}

export type GlobalErrorSubscriber = (msg: GlobalErrorMessage) => void
export type GlobalErrorUnsubscriber = () => void

export interface GlobalErrorChannel {
  subscribe: (subscriber: GlobalErrorSubscriber) => GlobalErrorUnsubscriber
}
