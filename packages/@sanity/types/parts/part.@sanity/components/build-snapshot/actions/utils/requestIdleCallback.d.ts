interface IdleDeadline {
  didTimeout: boolean
  timeRemaining: () => DOMHighResTimeStamp
}
interface IdleOptions {
  timeout: number
}
declare type IdleCallback = (deadline: IdleDeadline) => void
export declare const requestIdleCallback: (callback: IdleCallback, options?: IdleOptions) => number
export declare const cancelIdleCallback: (handle: number) => void
export {}
