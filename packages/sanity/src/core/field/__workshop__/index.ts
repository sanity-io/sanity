import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope({
  name: 'core/field',
  title: 'field',
  stories: [
    {
      name: 'change-breadcrumb',
      title: 'Change Breadcrumb',
      component: lazy(() => import('./ChangeBreadcrumbStory')),
    },
    {
      name: 'change-list',
      title: 'Change List',
      component: lazy(() => import('./ChangeListStory')),
    },
    {
      name: 'change-resolver',
      title: 'Change Resolver',
      component: lazy(() => import('./ChangeResolverStory')),
    },
    {
      name: 'change-title-segment',
      title: 'Change Title Segment',
      component: lazy(() => import('./ChangeTitleSegmentStory')),
    },
    {
      name: 'diff-card',
      title: 'Diff card',
      component: lazy(() => import('./DiffCardStory')),
    },
    {
      name: 'diff-error-boundary',
      title: 'Diff Error Boundary',
      component: lazy(() => import('./DiffErrorBoundaryStory')),
    },
    {
      name: 'meta-info',
      title: 'Meta info',
      component: lazy(() => import('./MetaInfoStory')),
    },
    {
      name: 'no-changes',
      title: 'No changes',
      component: lazy(() => import('./NoChangesStory')),
    },
    {
      name: 'revert-changes-button',
      title: 'Revert changes button',
      component: lazy(() => import('./RevertChangesButtonStory')),
    },
    {
      name: 'value-error',
      title: 'Value error',
      component: lazy(() => import('./ValueErrorStory')),
    },
  ],
})
