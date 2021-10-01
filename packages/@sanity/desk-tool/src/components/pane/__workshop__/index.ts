import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope('desk-tool/pane', 'Pane', [
  {
    name: 'tabs',
    title: 'Tabs',
    component: lazy(() => import('./tabs')),
  },
  {
    name: 'example',
    title: 'Example',
    component: lazy(() => import('./example')),
  },
  {
    name: 'split-panes',
    title: 'Split panes',
    component: lazy(() => import('./SplitPanes')),
  },
  {
    name: 'change-connectors',
    title: 'Change connectors',
    component: lazy(() => import('./changeConnectors')),
  },
  {
    name: 'resize',
    title: 'Resize',
    component: lazy(() => import('./resize')),
  },
])
