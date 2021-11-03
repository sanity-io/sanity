import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope('form-builder/inputs/portable-text', 'PortableTextInput', [
  {
    name: 'default',
    title: 'Default Schema',
    component: lazy(() => import('./default/Story')),
  },
  {
    name: 'custom',
    title: 'Custom Schema',
    component: lazy(() => import('./custom/Story')),
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
])
