import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope('@default-layout/update', 'Update', [
  {
    name: 'upgrade-accordion',
    title: 'UpgradeAccordion',
    component: lazy(() => import('./UpgradeAccordionStory')),
  },
  {
    name: 'changelog-dialog',
    title: 'ChangelogDialog',
    component: lazy(() => import('./ChangelogDialogStory')),
  },
  {
    name: 'portable-text-content',
    title: 'PortableTextContent',
    component: lazy(() => import('./PortableTextContentStory')),
  },
])
