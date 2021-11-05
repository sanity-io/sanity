import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope('base/previews', 'Previews', [
  {
    name: 'default-preview',
    title: 'DefaultPreview',
    component: lazy(() => import('./DefaultPreviewStory')),
  },
  {
    name: 'block-image-preview',
    title: 'BlockImagePreview',
    component: lazy(() => import('./BlockImagePreviewStory')),
  },
  {
    name: 'inline-preview',
    title: 'InlinePreview',
    component: lazy(() => import('./InlinePreviewStory')),
  },
  {
    name: 'block-preview',
    title: 'BlockPreview',
    component: lazy(() => import('./BlockPreviewStory')),
  },
])
