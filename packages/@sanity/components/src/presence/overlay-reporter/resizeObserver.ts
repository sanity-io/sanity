import {Observable, Subject} from 'rxjs'
import {filter} from 'rxjs/operators'

import {ResizeObserver as Polyfill} from '@juggle/resize-observer'
const ResizeObserver = window.ResizeObserver || Polyfill

export interface ObservableResizeObserver {
  observe: (element: Element) => Observable<ResizeObserverEntry>
}

export const createResizeObserver = (): ObservableResizeObserver => {
  const entries$ = new Subject<ResizeObserverEntry>()
  const resizeObserver = new ResizeObserver(entries => {
    entries.forEach(entry => {
      entries$.next(entry)
    })
  })
  return {
    observe: (element: Element) => {
      return new Observable<ResizeObserverEntry>(subscriber => {
        const subscription = entries$
          .pipe(filter(entry => entry.target === element))
          .subscribe(subscriber)
        resizeObserver.observe(element)
        return () => {
          subscription.unsubscribe()
          resizeObserver.unobserve(element)
        }
      })
    }
  }
}
