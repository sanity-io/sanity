import React from 'react'
import {CommentsOnboardingProvider, CommentsSetupProvider} from '../../src'
import {LayoutProps} from 'sanity'

export function CommentsLayout(props: LayoutProps) {
  return (
    <CommentsSetupProvider>
      <CommentsOnboardingProvider>{props.renderDefault(props)}</CommentsOnboardingProvider>
    </CommentsSetupProvider>
  )
}
