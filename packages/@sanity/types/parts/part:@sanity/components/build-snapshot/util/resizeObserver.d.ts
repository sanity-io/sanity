/// <reference types="resize-observer-browser" />
import {ResizeObserverEntry} from '@juggle/resize-observer'
import {Subscriber} from 'nano-pubsub'
export interface SharedResizeObserver {
  observe: (
    element: Element,
    observer: Subscriber<ResizeObserverEntry>,
    options?: ResizeObserverOptions
  ) => () => void
}
export declare const createSharedResizeObserver: () => SharedResizeObserver
export declare const resizeObserver: SharedResizeObserver
