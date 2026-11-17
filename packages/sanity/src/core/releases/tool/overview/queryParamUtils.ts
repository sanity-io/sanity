import {format} from 'date-fns/format'
import {isValid} from 'date-fns/isValid'
import {parse} from 'date-fns/parse'
import {type RouterContextValue, type SearchParam} from 'sanity/router'

import {type ReleaseDateFilter} from '../../util/releaseDateFilter'

export type Mode = 'active' | 'paused' | 'archived'
export type CardinalityView = 'releases' | 'drafts' | 'all'

export const GROUP_SEARCH_PARAM_KEY = 'group'
export const RELEASE_NOT_FOUND_SEARCH_PARAM_KEY = 'releaseNotFound'
const DATE_SEARCH_PARAM_KEY = 'date'
/** Size of the date bucket: absent means a single day (the calendar filter), else `week`/`month`. */
const DATE_RANGE_SEARCH_PARAM_KEY = 'dateRange'
/** `date=unscheduled` filters to releases with no date. */
const UNSCHEDULED_DATE_SEARCH_PARAM_VALUE = 'unscheduled'
const VIEW_SEARCH_PARAM_KEY = 'view'

const DATE_SEARCH_PARAM_VALUE_FORMAT = 'yyyy-MM-dd'

export function getInitialReleaseNotFound(router: RouterContextValue): boolean {
  return (
    new URLSearchParams(router.state._searchParams).get(RELEASE_NOT_FOUND_SEARCH_PARAM_KEY) ===
    'true'
  )
}

export const getInitialDateFilter =
  (router: RouterContextValue) => (): ReleaseDateFilter | undefined => {
    const params = new URLSearchParams(router.state._searchParams)
    const value = params.get(DATE_SEARCH_PARAM_KEY)
    if (!value) return undefined
    if (value === UNSCHEDULED_DATE_SEARCH_PARAM_VALUE) return {kind: 'unscheduled'}

    // Parsed as wall-clock components (local midnight), the same shape the calendar produces.
    const start = parse(value, DATE_SEARCH_PARAM_VALUE_FORMAT, new Date())
    if (!isValid(start)) return undefined

    const range = params.get(DATE_RANGE_SEARCH_PARAM_KEY)
    const unit = range === 'week' || range === 'month' ? range : 'day'
    return {kind: 'range', unit, start}
  }

export const getInitialReleaseGroupMode = (router: RouterContextValue) => (): Mode => {
  const activeGroupMode = new URLSearchParams(router.state._searchParams).get(
    GROUP_SEARCH_PARAM_KEY,
  )

  if (activeGroupMode === 'archived') return 'archived'
  if (activeGroupMode === 'paused') return 'paused'
  return 'active'
}

export const getInitialCardinalityView =
  ({
    router,
    isScheduledDraftsEnabled,
    isReleasesEnabled,
  }: {
    router: RouterContextValue
    isScheduledDraftsEnabled: boolean
    isReleasesEnabled: boolean
  }) =>
  (): CardinalityView => {
    if (!isScheduledDraftsEnabled) {
      return 'releases'
    }

    if (!isReleasesEnabled) {
      return 'drafts'
    }

    //  Both are enabled, use the query param
    const cardinalityView = new URLSearchParams(router.state._searchParams).get(
      VIEW_SEARCH_PARAM_KEY,
    )

    // 'all' is the default (no param). 'drafts' and 'releases' are the non-default
    // values we store in the query param; absence of the param means 'all'.
    if (cardinalityView === 'drafts') return 'drafts'
    if (cardinalityView === 'releases') return 'releases'
    return 'all'
  }

export const buildReleasesSearchParams = (
  releaseDateFilter: ReleaseDateFilter | undefined,
  releaseGroupMode: Mode,
  cardinalityView: CardinalityView,
): SearchParam[] => {
  const params: SearchParam[] = []

  if (releaseDateFilter?.kind === 'unscheduled') {
    params.push([DATE_SEARCH_PARAM_KEY, UNSCHEDULED_DATE_SEARCH_PARAM_VALUE])
  } else if (releaseDateFilter) {
    params.push([
      DATE_SEARCH_PARAM_KEY,
      format(releaseDateFilter.start, DATE_SEARCH_PARAM_VALUE_FORMAT),
    ])
    if (releaseDateFilter.unit !== 'day') {
      params.push([DATE_RANGE_SEARCH_PARAM_KEY, releaseDateFilter.unit])
    }
  } else if (releaseGroupMode !== 'active') {
    // Add group param when there's no date filter and it's not 'active' (default)
    params.push([GROUP_SEARCH_PARAM_KEY, releaseGroupMode])
  }

  // Only add view param when it's not 'all' (the default, no param needed)
  if (cardinalityView === 'drafts' || cardinalityView === 'releases') {
    params.push([VIEW_SEARCH_PARAM_KEY, cardinalityView])
  }

  return params
}
