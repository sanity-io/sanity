import {type RouterContextValue} from 'sanity/router'

export type Mode = 'active' | 'archived'

export const DATE_SEARCH_PARAM_KEY = 'date'
export const GROUP_SEARCH_PARAM_KEY = 'group'

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

  return activeGroupMode === 'archived' ? 'archived' : 'active'
}
