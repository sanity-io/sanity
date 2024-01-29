import React from 'react'
import {CommentsOnboardingProvider, CommentsSetupProvider, CommentsUpsellProvider} from '../../src'
import {LayoutProps} from 'sanity'

export function CommentsStudioLayout(props: LayoutProps) {
  return (
    <CommentsSetupProvider>
      <CommentsOnboardingProvider>
        <CommentsUpsellProvider>{props.renderDefault(props)}</CommentsUpsellProvider>
      </CommentsOnboardingProvider>
    </CommentsSetupProvider>
  )
}
