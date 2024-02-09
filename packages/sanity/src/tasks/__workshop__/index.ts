import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope({
  name: 'tasks',
  title: 'Tasks',
  stories: [
    {
      name: 'tasks-layout',
      title: 'TasksLayout',
      component: lazy(() => import('./TasksLayoutStory')),
    },
    {
      name: 'tasks-create',
      title: 'TasksCreate',
      component: lazy(() => import('./TasksCreateStory')),
    },
  ],
})
