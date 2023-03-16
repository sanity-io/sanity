import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope({
  name: 'core/form/inputs/files',
  title: 'Files',
  stories: [
    {
      name: 'upload-placeholder',
      title: 'UploadPlaceholder',
      component: lazy(() => import('./UploadPlaceholderStory')),
    },
  ],
})
