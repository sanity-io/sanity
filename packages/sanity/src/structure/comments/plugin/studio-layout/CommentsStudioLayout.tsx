import {CommentsOnboardingProvider, CommentsSetupProvider, CommentsUpsellProvider} from '../../src'
import {ConditionalWrapper} from '../../../../ui-components/conditionalWrapper'
import {LayoutProps, useFeatureEnabled} from 'sanity'

export function CommentsStudioLayout(props: LayoutProps) {
  const {enabled, isLoading} = useFeatureEnabled('studioComments')

  return (
    <CommentsSetupProvider>
      <CommentsOnboardingProvider>
        <ConditionalWrapper
          condition={!enabled && !isLoading}
          // eslint-disable-next-line react/jsx-no-bind
          wrapper={(children) => <CommentsUpsellProvider>{children}</CommentsUpsellProvider>}
        >
          {props.renderDefault(props)}
        </ConditionalWrapper>
      </CommentsOnboardingProvider>
    </CommentsSetupProvider>
  )
}
