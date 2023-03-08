import {RocketIcon} from '@sanity/icons'
import {lazy} from 'react'
import {defineDocumentInspector} from 'sanity'

export const customInspector = defineDocumentInspector({
  name: 'custom',
  menuItem: {
    icon: RocketIcon,
    title: 'Custom',
  },
  component: lazy(() => import('./inspector')),
  showAsAction: true,
})
