import {ResizeObserver as ResizeObserverPolyfill} from '@juggle/resize-observer'

export const RO: {
  new (callback: ResizeObserverCallback): ResizeObserver
  prototype: ResizeObserver
} = typeof document === 'undefined' ? ResizeObserverPolyfill : window.ResizeObserver

export {RO as ResizeObserver}
