import {ResizeObserver as ResizeObserverPolyfill} from '@juggle/resize-observer'

export const RO = window.ResizeObserver || ResizeObserverPolyfill

export {RO as ResizeObserver}
