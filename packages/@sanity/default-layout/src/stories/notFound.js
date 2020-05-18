import {DebugRouterProvider} from 'part:@sanity/storybook/components'
import React from 'react'
import NotFound from '../components/NotFound'

export function NotFoundStory() {
  return (
    <DebugRouterProvider>
      <NotFound>
        <p>Content</p>
      </NotFound>
    </DebugRouterProvider>
  )
}
