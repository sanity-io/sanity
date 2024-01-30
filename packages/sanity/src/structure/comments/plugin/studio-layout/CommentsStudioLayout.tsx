import React from 'react'
import {CommentsOnboardingProvider, CommentsSetupProvider, CommentsUpsellProvider} from '../../src'
import {ConditionalWrapper} from '../../../../ui-components/conditionalWrapper'
import {LayoutProps, useFeatureEnabled} from 'sanity'

export function CommentsStudioLayout(props: LayoutProps) {
  // TODO: Remove _enabled before merging
  const {enabled: _enabled, isLoading} = useFeatureEnabled('studioComments')
  const enabled = false

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
