import {defineEvent} from '@sanity/telemetry'

export const PortableTextInputExpanded = defineEvent({
  version: 1,
  name: 'Portable Text Editor Expanded',
  description: 'The portable text editor was expanded',
})

export const PortableTextInputCollapsed = defineEvent({
  version: 1,
  name: 'Portable Text Editor Collapsed',
  description: 'The portable text editor was collapsed',
})

export const PortableTextInvalidValueIgnore = defineEvent({
  version: 1,
  name: 'Portable Text Editor Invalid Value Ignored',
  description:
    'The portable text got an invalid value from the form and pressed button to ignore it',
})

export const PortableTextInvalidValueResolve = defineEvent<{
  PTEInvalidValueId: string
  PTEInvalidValueDescription: string
}>({
  version: 1,
  name: 'Portable Text Editor Invalid Value Resolved',
  description:
    'The portable text got an invalid value from the form and pressed button to resolve it.',
})

/**
 * When a draft is successfully created
 * @internal
 */
export const CreatedDraft = defineEvent({
  name: 'New Draft Created',
  version: 1,
  description: 'User created a new draft',
})
