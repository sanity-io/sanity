import {Subject} from 'rxjs'

const id = arg => arg
export const createResizeObserver = () => {
  const entries$ = new Subject()
  const mappers = new WeakMap()
  //@ts-ignore
  const resizeObserver = new ResizeObserver(entries => {
    entries$.next(
      entries.map(entry => {
        return mappers.get(entry.target)(entry)
      })
    )
  })
  return {
    entries$: entries$.asObservable(),
    observe: (element, map = id) => {
      mappers.set(element, map)
      resizeObserver.observe(element)
      return () => {
        mappers.delete(element)
        resizeObserver.unobserve(element)
      }
    }
  }
}
