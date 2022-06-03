import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope('sanity/preview', 'Preview', [
  {
    name: 'example',
    title: 'Example',
    component: lazy(() => import('./PreviewStory')),
  },

  {
    name: 'observe-for-preview',
    title: 'ObserveForPreview',
    component: lazy(() => import('./ObserveForPreviewStory')),
  },

  {
    name: 'preview-fields',
    title: 'PreviewFields',
    component: lazy(() => import('./PreviewFieldsStory')),
  },

  {
    name: 'preview-subscriber',
    title: 'PreviewSubscriber',
    component: lazy(() => import('./PreviewSubscriberStory')),
  },

  {
    name: 'render-preview-snapshot',
    title: 'RenderPreviewSnapshot',
    component: lazy(() => import('./RenderPreviewSnapshotStory')),
  },
])
