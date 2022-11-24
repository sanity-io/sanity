import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'
import DefaultSchemaStory from './defaultSchema/Story'

export default defineScope({
  name: 'sanity/form/portable-text-input',
  title: 'PortableTextInput',
  stories: [
    {
      name: 'default',
      title: 'Default Schema',
      component: DefaultSchemaStory,
      // component: lazy(() => import('./defaultSchema/Story')),
    },
    {
      name: 'custom',
      title: 'Custom Schema',
      component: lazy(() => import('./customSchema/Story')),
    },
    {
      name: 'list-counter',
      title: 'List counter',
      component: lazy(() => import('./listCounter')),
    },
    {
      name: 'edit-objects',
      title: 'Edit objects',
      component: lazy(() => import('./editObjects')),
    },
    {
      name: 'text-blocks',
      title: 'Text blocks',
      component: lazy(() => import('./textBlocks')),
    },
  ],
})
