import {ResizeObserver as Polyfill, ResizeObserverEntry} from '@juggle/resize-observer'
import createPubSub, {Subscriber} from 'nano-pubsub'

const ResizeObserver: typeof Polyfill =
  typeof document === 'object' && typeof window === 'object' && window.ResizeObserver
    ? window.ResizeObserver
    : Polyfill

/** @internal */
export interface SharedResizeObserver {
  observe: (
    element: Element,
    observer: Subscriber<ResizeObserverEntry>,
    options?: ResizeObserverOptions,
  ) => () => void
  unobserve: (element: Element) => void
}

/** @internal */
export const createSharedResizeObserver = (): SharedResizeObserver => {
  const event = createPubSub<ResizeObserverEntry[]>()

  const resizeObserver = new ResizeObserver((entries: ResizeObserverEntry[]) =>
    event.publish(entries),
  )

  return {
    observe: (
      element: Element,
      observer: Subscriber<ResizeObserverEntry>,
      options?: ResizeObserverOptions,
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
    unobserve: (element: Element) => resizeObserver.unobserve(element),
  }
}

/** @internal */
export const resizeObserver = createSharedResizeObserver()
