import {TerminalIcon} from '@sanity/icons'
import {definePlugin} from 'sanity'
import {route} from 'sanity/router'

import {type WorkshopOptions} from './types'
import {WorkshopTool} from './WorkshopTool'

export const workshopTool = definePlugin<WorkshopOptions>((options) => ({
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
}))
