import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {concat, of} from 'rxjs'
import {delay, distinctUntilChanged, map, startWith, switchMap} from 'rxjs/operators'

import {intersectionObservableFor} from './streams/intersectionObservableFor'
import {visibilityChange$} from './streams/visibilityChange'

interface Props {
  /**
   * Disable the check. The hook will return false if disabled
   */
  disabled?: boolean
  /** DOM Node to check visibility for */
  element: HTMLElement | null
  /** When element is hidden, wait this delay in milliseconds before reporting it as */
  hideDelay?: number
}

export function useVisibility(props: Props): boolean {
  const {element, hideDelay = 0, disabled} = props

  // Seed useObservable with the same initial check the stream uses so the first
  // paint is correct before subscription settles (avoids a false→true flash).
  const initialVisible =
    !element || disabled ? false : 'checkVisibility' in element ? element.checkVisibility() : false

  const visible$ = useMemo(() => {
    if (!element || disabled) {
      return of(false)
    }

    const seed = 'checkVisibility' in element ? element.checkVisibility() : false

    const isDocumentVisible$ = concat(
      of(!document.hidden),
      visibilityChange$.pipe(
        map((event) => (event.target instanceof Document ? !event?.target?.hidden : false)),
      ),
    ).pipe(distinctUntilChanged())

    const inViewport$ = intersectionObservableFor(element).pipe(
      map((event) => event.isIntersecting),
    )

    return isDocumentVisible$.pipe(
      switchMap((isDocumentVisible) => (isDocumentVisible ? inViewport$ : of(false))),
      switchMap((isVisible) => (isVisible ? of(true) : of(false).pipe(delay(hideDelay)))),
      distinctUntilChanged(),
      startWith(seed),
    )
  }, [element, hideDelay, disabled])

  const visible = useObservable(visible$, initialVisible)

  return disabled ? false : visible
}
