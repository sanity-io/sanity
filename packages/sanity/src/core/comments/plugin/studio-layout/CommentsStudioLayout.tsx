import type {LayoutProps} from '../../../config/studio/types'
import {useFeatureEnabled} from '../../../hooks/useFeatureEnabled'
import {FEATURES} from '../../../hooks/useFeatureEnabled'
import {AddonDatasetProvider} from '../../../studio/addonDataset/AddonDatasetProvider'
import {CommentsOnboardingProvider} from '../../context/onboarding/CommentsOnboardingProvider'
import {CommentsUpsellProvider} from '../../context/upsell/CommentsUpsellProvider'

export function CommentsStudioLayout(props: LayoutProps) {
  const {enabled, isLoading} = useFeatureEnabled(FEATURES.studioComments)
  const children = props.renderDefault(props)

  return (
    <AddonDatasetProvider>
      <CommentsOnboardingProvider>
        {!enabled && !isLoading ? (
          <CommentsUpsellProvider>{children}</CommentsUpsellProvider>
        ) : (
          children
        )}
      </CommentsOnboardingProvider>
    </AddonDatasetProvider>
  )
}
