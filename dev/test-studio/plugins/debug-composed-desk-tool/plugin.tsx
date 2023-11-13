import {lazy} from 'react'
import {definePlugin} from 'sanity'

export const debugComposedDeskTool = definePlugin({
  name: 'test/debug-composed-desk-tool',

  tools: [
    {
      name: 'debug-composed-desk',
      title: 'Debug Composed Desk',
      component: lazy(() => import('./tool')),
    },
  ],
})
