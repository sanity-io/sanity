import {RocketIcon} from '@sanity/icons'
import {lazy} from 'react'
import {defineDocumentInspector} from 'sanity'

export const customInspector = defineDocumentInspector({
  name: 'custom',
  useMenuItem: () => ({
    icon: RocketIcon,
    showAsAction: true,
    title: 'Custom inspector',
  }),
  component: lazy(() => import('./inspector')),
})
