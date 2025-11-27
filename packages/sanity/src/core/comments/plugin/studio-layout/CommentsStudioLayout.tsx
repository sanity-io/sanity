import {type LayoutProps} from '../../../config'
import {useFeatureEnabled} from '../../../hooks'
import {FEATURES} from '../../../hooks/useFeatureEnabled'
import {AddonDatasetProvider} from '../../../studio'
import {CommentsOnboardingProvider, CommentsUpsellProvider} from '../../context'

export function CommentsStudioLayout(props: LayoutProps) : React.JSX.Element {
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
