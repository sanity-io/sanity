import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope('desk-tool/pane', 'Pane', [
  {
    name: 'example',
    title: 'Example',
    component: lazy(() => import('./ExampleStory')),
  },
  {
    name: 'split-panes',
    title: 'Split panes',
    component: lazy(() => import('./SplitPanesStory')),
  },
  {
    name: 'change-connectors',
    title: 'Change connectors',
    component: lazy(() => import('./ChangeConnectorsStory')),
  },
  {
    name: 'resize',
    title: 'Resize',
    component: lazy(() => import('./ResizeStory')),
  },
])
