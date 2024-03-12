import {AddonDatasetProvider, type LayoutProps, useFeatureEnabled} from 'sanity'

import {ConditionalWrapper} from '../../../../ui-components/conditionalWrapper'
import {CommentsOnboardingProvider, CommentsUpsellProvider} from '../../src'

interface CommentStudioLayoutProps extends LayoutProps {
  withAddonDatasetProvider?: boolean
}

export function CommentsStudioLayout(props: CommentStudioLayoutProps) {
  const {withAddonDatasetProvider = true, ...defaultProps} = props
  const {enabled, isLoading} = useFeatureEnabled('studioComments')

  return (
    <ConditionalWrapper
      condition={Boolean(withAddonDatasetProvider)}
      wrapper={(children) => <AddonDatasetProvider>{children}</AddonDatasetProvider>}
    >
      <CommentsOnboardingProvider>
        <ConditionalWrapper
          condition={!enabled && !isLoading}
          wrapper={(children) => <CommentsUpsellProvider>{children}</CommentsUpsellProvider>}
        >
          {defaultProps.renderDefault(defaultProps)}
        </ConditionalWrapper>
      </CommentsOnboardingProvider>
    </ConditionalWrapper>
  )
}
