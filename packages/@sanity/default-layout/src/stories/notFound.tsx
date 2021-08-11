// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {DebugRouterProvider} from 'part:@sanity/storybook/components'
import React from 'react'
import NotFound from '../main/NotFound'

export function NotFoundStory() {
  return (
    <DebugRouterProvider>
      <NotFound>
        <p>Content</p>
      </NotFound>
    </DebugRouterProvider>
  )
}
