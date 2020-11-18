import {Subject, Observable} from 'rxjs'
import {filter} from 'rxjs/operators'

export interface ObservableIntersectionObserver {
  observe: (element: Element) => Observable<IntersectionObserverEntry>
}

export const createIntersectionObserver = (
  options?: IntersectionObserverInit
): ObservableIntersectionObserver => {
  const entries$ = new Subject<IntersectionObserverEntry>()
  const intersectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      entries$.next(entry)
    })
  }, options)
  return {
    observe: (element: Element) => {
      return new Observable<IntersectionObserverEntry>((subscriber) => {
        const subscription = entries$
          .pipe(filter((entry) => entry.target === element))
          .subscribe(subscriber)
        intersectionObserver.observe(element)
        return () => {
          subscription.unsubscribe()
          intersectionObserver.unobserve(element)
        }
      })
    },
  }
}
