import {Subject} from 'rxjs'

const id = arg => arg
export const createIntersectionObserver = (options?: IntersectionObserverInit) => {
  const entries$ = new Subject()
  const mappers = new WeakMap()
  const intersectionObserver = new IntersectionObserver(entries => {
    entries$.next(
      entries.map(entry => {
        return mappers.get(entry.target)(entry)
      })
    )
  }, options)
  return {
    entries$: entries$.asObservable(),
    observe: (element, map = id) => {
      mappers.set(element, map)
      intersectionObserver.observe(element)
      return () => {
        mappers.delete(element)
        intersectionObserver.unobserve(element)
      }
    }
  }
}
