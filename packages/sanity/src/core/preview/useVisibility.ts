import {useLayoutEffect, useState} from 'react'
import {concat, of} from 'rxjs'
import {delay, distinctUntilChanged, map, switchMap} from 'rxjs/operators'

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
  const [visible, setVisible] = useState(false)

  useLayoutEffect(() => {
    if (!element || disabled) {
      return undefined
    }

    if (element && 'checkVisibility' in element) {
      setVisible(element.checkVisibility())
    }

    const isDocumentVisible$ = concat(
      of(!document.hidden),
      visibilityChange$.pipe(
        map((event) => (event.target instanceof Document ? !event?.target?.hidden : false)),
      ),
    ).pipe(distinctUntilChanged())

    const inViewport$ = intersectionObservableFor(element).pipe(
      map((event) => event.isIntersecting),
    )

    const visible$ = isDocumentVisible$.pipe(
      switchMap((isDocumentVisible) => (isDocumentVisible ? inViewport$ : of(false))),
      switchMap((isVisible) => (isVisible ? of(true) : of(false).pipe(delay(hideDelay)))),
      distinctUntilChanged(),
    )

    const sub = visible$.subscribe(setVisible)

    return () => sub.unsubscribe()
  }, [element, hideDelay, disabled])

  return disabled ? false : visible
}
