import {use} from 'react'
import {CommentsFeaturesPromiseContext} from 'sanity/_singletons'

import {type LayoutProps} from '../../../config/studio/types'
import {AddonDatasetProvider} from '../../../studio/addonDataset/AddonDatasetProvider'
import {CommentsOnboardingProvider} from '../../context/onboarding/CommentsOnboardingProvider'
import {CommentsUpsellProvider} from '../../context/upsell/CommentsUpsellProvider'

export function CommentsStudioLayout(props: LayoutProps) {
  // Started by `CommentsStudioProvider` above the studio's loading screen; suspends up to that
  // screen until the feature check is settled, so whether the upsell provider wraps the layout is
  // decided once and the studio below is never remounted by a late answer.
  const {enabled} = use(use(CommentsFeaturesPromiseContext))
  const children = props.renderDefault(props)

  return (
    <AddonDatasetProvider>
      <CommentsOnboardingProvider>
        {enabled ? children : <CommentsUpsellProvider>{children}</CommentsUpsellProvider>}
      </CommentsOnboardingProvider>
    </AddonDatasetProvider>
  )
}
