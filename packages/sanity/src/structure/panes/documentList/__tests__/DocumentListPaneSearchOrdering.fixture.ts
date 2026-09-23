import {type PaneMenuItem} from '../../../types'

/** Configured sort orderings shared by the jsdom test and the Chromatic sentinel. */
export const ORDERINGS: PaneMenuItem[] = [
  {
    id: 'updated-desc',
    title: 'Last edited',
    action: 'setSortOrder',
    params: {by: [{field: '_updatedAt', direction: 'desc'}]},
  },
  {
    id: 'title-asc',
    title: 'Title',
    action: 'setSortOrder',
    params: {by: [{field: 'title', direction: 'asc'}]},
  },
]
