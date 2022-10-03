import {TerminalIcon} from '@sanity/icons'
import {createPlugin} from 'sanity'
import {route} from 'sanity/router'
import {WorkshopTool} from './WorkshopTool'
import {WorkshopOptions} from './types'

export const workshopTool = createPlugin<WorkshopOptions>((options) => ({
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
