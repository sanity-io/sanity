import {createPlugin, route} from 'sanity'
import {TerminalIcon} from '@sanity/icons'
import {WorkshopOptions} from './types'
import {WorkshopTool} from './WorkshopTool'

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
