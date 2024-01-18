import {defineEvent} from '@sanity/telemetry'

export const ExpandPortableTextInput = defineEvent({
  version: 1,
  name: 'Expand PTE',
  description: 'The portable text editor was expanded',
})

export const CollapsePortableTextInput = defineEvent({
  version: 1,
  name: 'Collapse PTE',
  description: 'The portable text editor was collapsed',
})
