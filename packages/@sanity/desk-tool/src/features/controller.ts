import {combineLatest, Observable} from 'rxjs'
import {map} from 'rxjs/operators'
import {BREAKPOINT_SCREEN_MEDIUM} from '../constants'
import windowWidth$ from '../utils/windowWidth'
import {DeskToolFeatures} from './types'

export function createDeskToolFeaturesController() {
  // determine if the screen is narrow
  const isNarrowScreen$: Observable<boolean> = windowWidth$.pipe(
    map((windowWidth: number) => windowWidth < BREAKPOINT_SCREEN_MEDIUM)
  )

  // determine if "reviewChanges" are available
  const reviewChanges$ = isNarrowScreen$.pipe(map((val) => !val))

  // determine if "splitPanes" are available
  const splitPanes$ = isNarrowScreen$.pipe(map((val) => !val))

  // determine if "splitViews" are available
  const splitViews$ = isNarrowScreen$.pipe(map((val) => !val))

  // combine streams of features flags
  const state$: Observable<DeskToolFeatures> = combineLatest([
    reviewChanges$,
    splitPanes$,
    splitViews$,
  ]).pipe(
    map(([reviewChanges, splitPanes, splitViews]) => ({
      reviewChanges,
      splitPanes,
      splitViews,
    }))
  )

  return {state$}
}
