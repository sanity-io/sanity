/** @internal */
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

/** @internal */
export type GlobalErrorSubscriber = (msg: GlobalErrorMessage) => void

/** @internal */
export type GlobalErrorUnsubscriber = () => void

/** @internal */
export interface GlobalErrorChannel {
  subscribe: (subscriber: GlobalErrorSubscriber) => GlobalErrorUnsubscriber
}
