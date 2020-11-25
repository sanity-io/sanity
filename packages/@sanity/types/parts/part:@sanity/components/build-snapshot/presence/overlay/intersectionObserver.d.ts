import {Observable} from 'rxjs'
export interface ObservableIntersectionObserver {
  observe: (element: Element) => Observable<IntersectionObserverEntry>
}
export declare const createIntersectionObserver: (
  options?: IntersectionObserverInit
) => ObservableIntersectionObserver
