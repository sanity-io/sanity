import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope({
  name: 'core/studio/navbar/base',
  title: 'Navbar',
  stories: [
    {
      name: 'navbar',
      title: 'Navbar',
      component: lazy(() => import('./NavbarStory')),
    },
    {
      name: 'new-document-button',
      title: 'NewDocumentButton',
      component: lazy(() => import('./NewDocumentButtonStory')),
    },
    {
      name: 'resources-button',
      title: 'ResourcesButton',
      component: lazy(() => import('./ResourcesButtonStory')),
    },
    {
      name: 'resources-menu-items',
      title: 'ResourcesMenuItems',
      component: lazy(() => import('./ResourcesMenuItemsStory')),
    },
    {
      name: 'workspacePreview',
      title: 'WorkspacePreview',
      component: lazy(() => import('./WorkspacePreviewStory')),
    },
  ],
})
