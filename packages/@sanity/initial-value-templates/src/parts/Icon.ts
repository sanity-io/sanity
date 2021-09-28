import {ComposeIcon, SortIcon, StackCompactIcon, SplitHorizontalIcon} from '@sanity/icons'

// @todo This legacy typing causes linting errors once we touch anything
// in the structure package. We should update it in the future when we do
// a pass on types
// eslint-disable-next-line @typescript-eslint/ban-types
type FixMe = Function

export const getPlusIcon = (): FixMe => ComposeIcon
export const getSortIcon = (): FixMe => SortIcon
export const getListIcon = (): FixMe => StackCompactIcon
export const getDetailsIcon = (): FixMe => SplitHorizontalIcon
