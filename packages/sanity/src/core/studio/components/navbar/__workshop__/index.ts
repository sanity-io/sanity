import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope('sanity/studio/navbar', 'Navbar', [
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
    name: 'searchPopover',
    title: 'SearchPopover',
    component: lazy(() => import('./SearchPopoverStory')),
  },
  {
    name: 'searchDialog',
    title: 'SearchDialog',
    component: lazy(() => import('./SearchDialogStory')),
  },
  {
    name: 'workspacePreview',
    title: 'WorkspacePreview',
    component: lazy(() => import('./WorkspacePreviewStory')),
  },
])
