import {RouterProvider, route} from 'part:@sanity/base/router'
import {action} from 'part:@sanity/storybook/addons/actions'
import React from 'react'

const router = route('/', [route('/bikes/:bikeId'), route.intents('/intents')])

export function DebugRouterProvider({children}) {
  return (
    <RouterProvider
      router={router}
      onNavigate={action('onNavigate')}
      state={router.decode(location.pathname)}
    >
      {children}
    </RouterProvider>
  )
}
