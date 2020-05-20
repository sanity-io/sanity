// Todo: this can be safely removed at some point
import {ResizeObserver as Polyfill} from '@juggle/resize-observer'
export const ResizeObserver = (window as any).ResizeObserver || Polyfill
