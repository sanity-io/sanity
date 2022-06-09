import {useEffect, useState} from 'react'
import {concat, of} from 'rxjs'
import {delay, distinctUntilChanged, map, switchMap} from 'rxjs/operators'
import {intersectionObservableFor} from './streams/intersectionObservableFor'
import {visibilityChange$} from './streams/visibilityChange'

export function useVisibility(props: {element: HTMLElement | null; hideDelay?: number}): boolean {
  const {element, hideDelay = 0} = props
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!element) {
      return undefined
    }

    const isDocumentVisible$ = concat(
      of(!document.hidden),
      visibilityChange$.pipe(
        map((event) => (event.target instanceof Document ? !event?.target?.hidden : false))
      )
    ).pipe(distinctUntilChanged())

    const inViewport$ = intersectionObservableFor(element).pipe(
      map((event) => event.isIntersecting)
    )

    const visible$ = isDocumentVisible$.pipe(
      switchMap((isDocumentVisible) => (isDocumentVisible ? inViewport$ : of(false))),
      switchMap((isVisible) => (isVisible ? of(true) : of(false).pipe(delay(hideDelay)))),
      distinctUntilChanged()
    )

    const sub = visible$.subscribe(setVisible)

    return () => sub.unsubscribe()
  }, [element, hideDelay])

  return visible
}
