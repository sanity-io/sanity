import {ResizeObserver as Polyfill, ResizeObserverEntry} from '@juggle/resize-observer'

import createPubSub, {Subscriber} from 'nano-pubsub'

const ResizeObserver: typeof Polyfill = (window as any).ResizeObserver || Polyfill

export interface SharedResizeObserver {
  observe: (
    element: Element,
    observer: Subscriber<ResizeObserverEntry>,
    options?: ResizeObserverOptions
  ) => () => void
}

export const createSharedResizeObserver = (): SharedResizeObserver => {
  const event = createPubSub<ResizeObserverEntry[]>()
  const resizeObserver = new ResizeObserver((entries: ResizeObserverEntry[]) =>
    event.publish(entries)
  )
  return {
    observe: (
      element: Element,
      observer: Subscriber<ResizeObserverEntry>,
      options?: ResizeObserverOptions
    ) => {
      const unsubscribe = event.subscribe((entries) => {
        const entry = entries.find((e) => e.target === element)
        if (entry) {
          observer(entry)
        }
      })
      resizeObserver.observe(element, options)
      return () => {
        unsubscribe()
        resizeObserver.unobserve(element)
      }
    },
  }
}
export const resizeObserver = createSharedResizeObserver()
