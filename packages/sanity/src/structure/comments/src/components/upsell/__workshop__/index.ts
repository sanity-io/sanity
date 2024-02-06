import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope({
  name: 'structure/comments',
  title: 'comments',
  stories: [
    {
      name: 'comments-upsell-dialog',
      title: 'CommentsUpsellDialog',
      component: lazy(() => import('./CommentsUpsellDialogStory')),
    },
    {
      name: 'comments-upsell-panel',
      title: 'CommentsUpsellPanel',
      component: lazy(() => import('./CommentsUpsellPanelStory')),
    },
  ],
})
