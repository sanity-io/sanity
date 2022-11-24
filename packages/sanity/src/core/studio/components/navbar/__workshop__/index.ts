import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope({
  name: 'sanity/studio/navbar/base',
  title: 'Base',
  stories: [
    {
      name: 'navbar',
      title: 'Navbar',
      component: lazy(() => import('./NavbarStory')),
    },
    {
      name: 'changelog-dialog',
      title: 'ChangelogDialog',
      component: lazy(() => import('./ChangelogDialogStory')),
    },
    {
      name: 'workspacePreview',
      title: 'WorkspacePreview',
      component: lazy(() => import('./WorkspacePreviewStory')),
    },
  ],
})
