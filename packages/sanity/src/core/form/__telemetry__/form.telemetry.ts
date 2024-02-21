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

export const PortableTextInvalidValueIgnore = defineEvent({
  version: 1,
  name: 'Portable Text Editor ignore invalid value ',
  description:
    'The portable text got an invalid value from the form and pressed button to ignore it',
})

export const PortableTextInvalidValueResolve = defineEvent({
  version: 1,
  name: 'Portable Text Editor resolve invalid value',
  description:
    'The portable text got an invalid value from the form and pressed button to resolve it',
})
