import {ConditionalWrapper} from '../../../../ui-components'
import {type LayoutProps} from '../../../config'
import {useFeatureEnabled} from '../../../hooks'
import {FEATURES} from '../../../hooks/useFeatureEnabled'
import {AddonDatasetProvider} from '../../../studio'
import {CommentsOnboardingProvider, CommentsUpsellProvider} from '../../context'

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
