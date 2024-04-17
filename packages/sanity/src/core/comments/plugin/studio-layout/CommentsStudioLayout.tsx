import {ConditionalWrapper} from '../../../../ui-components/conditionalWrapper'
import {type LayoutProps} from '../../../config/studio/types'
import {useFeatureEnabled} from '../../../hooks/useFeatureEnabled'
import {AddonDatasetProvider} from '../../../studio/addonDataset'
import {CommentsOnboardingProvider, CommentsUpsellProvider} from '../..'

export function CommentsStudioLayout(props: LayoutProps) {
  const {enabled, isLoading} = useFeatureEnabled('studioComments')

  return (
    <AddonDatasetProvider>
      <CommentsOnboardingProvider>
        <ConditionalWrapper
          condition={!enabled && !isLoading}
          // eslint-disable-next-line react/jsx-no-bind
          wrapper={(children) => <CommentsUpsellProvider>{children}</CommentsUpsellProvider>}
        >
          {props.renderDefault(props)}
        </ConditionalWrapper>
      </CommentsOnboardingProvider>
    </AddonDatasetProvider>
  )
}
