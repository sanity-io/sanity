import {use, useContext} from 'react'
import {CommentsFeaturesPromiseContextV2} from 'sanity/_singletons'

import {type LayoutProps} from '../../../config/studio/types'
import {AddonDatasetProvider} from '../../../studio/addonDataset/AddonDatasetProvider'
import {CommentsOnboardingProvider} from '../../context/onboarding/CommentsOnboardingProvider'
import {CommentsUpsellProvider} from '../../context/upsell/CommentsUpsellProvider'

export function CommentsStudioLayout(props: LayoutProps) {
  const featuresPromise = useContext(CommentsFeaturesPromiseContextV2)
  if (!featuresPromise) {
    throw new Error(
      'CommentsStudioLayout: no CommentsFeaturesPromiseContextV2 above it. The comments plugin registers `CommentsStudioProviders` as `studio.components.providers` to provide it.',
    )
  }
  // Suspends up to `StudioLayout`'s loading screen until the feature check is settled: whether the
  // upsell provider wraps the layout is decided once, so the studio below is never remounted by a
  // late answer.
  const {enabled} = use(featuresPromise)
  const children = props.renderDefault(props)

  return (
    <AddonDatasetProvider>
      <CommentsOnboardingProvider>
        {enabled ? children : <CommentsUpsellProvider>{children}</CommentsUpsellProvider>}
      </CommentsOnboardingProvider>
    </AddonDatasetProvider>
  )
}
