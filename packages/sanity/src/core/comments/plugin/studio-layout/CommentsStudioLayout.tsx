import {ConditionalWrapper} from '../../../../ui-components/conditionalWrapper/ConditionalWrapper'
import {type LayoutProps} from '../../../config/studio/types'
import {FEATURES, useFeatureEnabled} from '../../../hooks/useFeatureEnabled'
import {AddonDatasetProvider} from '../../../studio/addonDataset/AddonDatasetProvider'
import {CommentsOnboardingProvider} from '../../context/onboarding/CommentsOnboardingProvider'
import {CommentsUpsellProvider} from '../../context/upsell/CommentsUpsellProvider'

export function CommentsStudioLayout(props: LayoutProps) {
  const {enabled, isLoading} = useFeatureEnabled(FEATURES.studioComments)

  return (
    <AddonDatasetProvider>
      <CommentsOnboardingProvider>
        <ConditionalWrapper
          condition={!enabled && !isLoading}
          wrapper={(children) => <CommentsUpsellProvider>{children}</CommentsUpsellProvider>}
        >
          {props.renderDefault(props)}
        </ConditionalWrapper>
      </CommentsOnboardingProvider>
    </AddonDatasetProvider>
  )
}
