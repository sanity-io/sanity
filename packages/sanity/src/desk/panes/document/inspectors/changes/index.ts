import {RestoreIcon} from '@sanity/icons'
import {lazy} from 'react'
import {DocumentInspector} from 'sanity'

export const changesInspector: DocumentInspector = {
  name: 'changes',
  menuItem: {
    icon: RestoreIcon,
    title: 'Review changes',
  },
  component: lazy(() => import('./inspector')),
  onClose: ({params}) => {
    return {params: {...params, since: undefined}}
  },
  onOpen: ({params}) => {
    return {params: {...params, since: '@lastPublished'}}
  },
}
