import {createPlugin, SanityPlugin} from '@sanity/base'
import {route} from '@sanity/base/router'
import {TerminalIcon} from '@sanity/icons'
import {WorkshopOptions} from './types'
import {WorkshopTool} from './WorkshopTool'

export function workshopTool(options: WorkshopOptions): SanityPlugin {
  return createPlugin({
    name: '@local/workshop',
    tools: [
      {
        name: options.name || 'workshop',
        title: options.title || 'Workshop',
        icon: options.icon || TerminalIcon,
        component: WorkshopTool,
        options,
        router: route.create('/', [route.create('/:path')]),
      },
    ],
  })
}
