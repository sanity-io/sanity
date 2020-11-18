import {ResizeObserver as ResizeObserverPolyfill} from '@juggle/resize-observer'

export const RO: typeof ResizeObserver = (window.ResizeObserver || ResizeObserverPolyfill) as any

export {RO as ResizeObserver}
