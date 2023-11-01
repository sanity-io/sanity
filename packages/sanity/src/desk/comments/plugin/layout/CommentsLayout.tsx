import React from 'react'
import {CommentsOnboardingProvider, CommentsSetupProvider} from '../../src'
import {LayoutProps} from 'sanity'

/**
 * @beta
 * @hidden
 */
export function CommentsLayout(props: LayoutProps) {
  return (
    <CommentsSetupProvider>
      <CommentsOnboardingProvider>{props.renderDefault(props)}</CommentsOnboardingProvider>
    </CommentsSetupProvider>
  )
}
