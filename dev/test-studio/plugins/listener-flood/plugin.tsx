import {BoltIcon} from '@sanity/icons/Bolt'
import {defineField, definePlugin, defineType} from 'sanity'

import {ListenerFlood} from './ListenerFlood'
import {ListenerFloodInput} from './ListenerFloodInput'

const listenerFloodDocument = defineType({
  name: 'listenerFloodDocument',
  title: 'Listener flood document',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      components: {input: ListenerFloodInput},
    }),
  ],
})

export const listenerFloodTool = definePlugin(() => {
  return {
    name: 'listener-flood',
    schema: {types: [listenerFloodDocument]},
    tools: [
      {
        name: 'listener-flood',
        title: 'Listener flood',
        icon: BoltIcon,
        component: ListenerFlood,
      },
    ],
  }
})
