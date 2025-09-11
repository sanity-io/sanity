import {format} from 'date-fns'
import {type RouterContextValue, type SearchParam} from 'sanity/router'

export type Mode = 'active' | 'archived'
export type CardinalityView = 'releases' | 'drafts'

export const DATE_SEARCH_PARAM_KEY = 'date'
export const GROUP_SEARCH_PARAM_KEY = 'group'
export const VIEW_SEARCH_PARAM_KEY = 'view'

const DATE_SEARCH_PARAM_VALUE_FORMAT = 'yyyy-MM-dd'

export const getInitialFilterDate = (router: RouterContextValue) => () => {
  const activeFilterDate = new URLSearchParams(router.state._searchParams).get(
    DATE_SEARCH_PARAM_KEY,
  )

  return activeFilterDate ? new Date(activeFilterDate) : undefined
}

export const getCardinalityViewFromUrl = (
  searchParams: [string, string][],
  isScheduledDraftsEnabled: boolean,
): CardinalityView => {
  if (!isScheduledDraftsEnabled) return 'releases'
  const urlSearchParams = new URLSearchParams(searchParams)
  const viewParam = urlSearchParams.get(VIEW_SEARCH_PARAM_KEY)
  return viewParam === 'drafts' ? 'drafts' : 'releases'
}

export const getReleaseGroupModeFromUrl = (searchParams: [string, string][]): Mode => {
  const urlSearchParams = new URLSearchParams(searchParams)
  const groupParam = urlSearchParams.get(GROUP_SEARCH_PARAM_KEY)
  return groupParam === 'archived' ? 'archived' : 'active'
}

export const buildReleasesSearchParams = (
  releaseFilterDate: Date | undefined,
  releaseGroupMode: Mode,
  cardinalityView: CardinalityView,
): SearchParam[] => {
  const params: SearchParam[] = []

  if (releaseFilterDate) {
    params.push([DATE_SEARCH_PARAM_KEY, format(releaseFilterDate, DATE_SEARCH_PARAM_VALUE_FORMAT)])
  } else if (releaseGroupMode === 'archived') {
    // Only add group param when there's no date filter and it's archived
    params.push([GROUP_SEARCH_PARAM_KEY, releaseGroupMode])
  }

  // Only add view param when it's 'drafts' (releases is default, no param needed)
  if (cardinalityView === 'drafts') {
    params.push([VIEW_SEARCH_PARAM_KEY, 'drafts'])
  }

  return params
}
