import {defineEvent} from '@sanity/telemetry'

export const PortableTextInputExpanded = defineEvent({
  version: 1,
  name: 'Portable Text Editor expanded',
  description: 'The portable text editor was expanded',
})

export const PortableTextInputCollapsed = defineEvent({
  version: 1,
  name: 'Portable Text Editor collapsed',
  description: 'The portable text editor was collapsed',
})
