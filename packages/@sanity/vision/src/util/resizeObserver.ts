import {ResizeObserver as ResizeObserverPolyfill} from '@juggle/resize-observer'

export const RO = typeof document === 'undefined' ? ResizeObserverPolyfill : window.ResizeObserver

export {RO as ResizeObserver}
