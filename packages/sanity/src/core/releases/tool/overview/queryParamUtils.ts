import {format} from 'date-fns/format'
import {type RouterContextValue, type SearchParam} from 'sanity/router'

export type Mode = 'active' | 'paused' | 'archived'
export type CardinalityView = 'releases' | 'drafts'

export const DATE_SEARCH_PARAM_KEY = 'date'
export const GROUP_SEARCH_PARAM_KEY = 'group'
export const VIEW_SEARCH_PARAM_KEY = 'view'
export const RELEASE_NOT_FOUND_SEARCH_PARAM_KEY = 'releaseNotFound'

const DATE_SEARCH_PARAM_VALUE_FORMAT = 'yyyy-MM-dd'

export function getInitialReleaseNotFound(router: RouterContextValue): boolean {
  return (
    new URLSearchParams(router.state._searchParams).get(RELEASE_NOT_FOUND_SEARCH_PARAM_KEY) ===
    'true'
  )
}

export const getInitialFilterDate = (router: RouterContextValue) => () => {
  const activeFilterDate = new URLSearchParams(router.state._searchParams).get(
    DATE_SEARCH_PARAM_KEY,
  )

  return activeFilterDate ? new Date(activeFilterDate) : undefined
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

    // 'drafts' is the only value we store in the query param
    // absence of the param means 'releases' (default)
    return cardinalityView === 'drafts' ? 'drafts' : 'releases'
  }

export const buildReleasesSearchParams = (
  releaseFilterDate: Date | undefined,
  releaseGroupMode: Mode,
  cardinalityView: CardinalityView,
): SearchParam[] => {
  const params: SearchParam[] = []

  if (releaseFilterDate) {
    params.push([DATE_SEARCH_PARAM_KEY, format(releaseFilterDate, DATE_SEARCH_PARAM_VALUE_FORMAT)])
  } else if (releaseGroupMode !== 'active') {
    // Add group param when there's no date filter and it's not 'active' (default)
    params.push([GROUP_SEARCH_PARAM_KEY, releaseGroupMode])
  }

  // Only add view param when it's 'drafts' (releases is default, no param needed)
  if (cardinalityView === 'drafts') {
    params.push([VIEW_SEARCH_PARAM_KEY, 'drafts'])
  }

  return params
}
