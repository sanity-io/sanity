import {SortOrder} from './types'

export const PARTIAL_PAGE_LIMIT = 100
export const FULL_LIST_LIMIT = 2000
export const DEFAULT_ORDERING: SortOrder = {by: [{field: '_createdAt', direction: 'desc'}]}
export const EMPTY_RECORD: Record<string, unknown> = {}
