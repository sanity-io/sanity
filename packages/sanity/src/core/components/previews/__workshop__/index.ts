import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope({
  name: 'core/components/previews',
  title: 'Previews',
  stories: [
    {
      name: 'general',
      title: 'General preview',
      component: lazy(() => import('./GeneralPreviewStory')),
    },
    {
      name: 'portable-text',
      title: 'Portable Text preview',
      component: lazy(() => import('./PortableTextPreviewStory')),
    },
    {
      name: 'template',
      title: 'Template preview',
      component: lazy(() => import('./TemplatePreviewStory')),
    },
    {
      name: 'inline',
      title: 'InlinePreview',
      component: lazy(() => import('./InlinePreviewStory')),
    },
  ],
})
