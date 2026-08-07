import {defineEvent} from '@sanity/telemetry'

interface NestedDialogOpenedInfo {
  path: string
}

interface NestedObjectInfoOrigin extends NestedDialogOpenedInfo {
  origin: 'default' | 'nested-object'
}

interface ArrayListObjectInfo extends NestedObjectInfoOrigin {
  location: 'array_list'
}

/**
 * When a nested dialog is opened
 */
export const NestedDialogOpened = defineEvent<NestedDialogOpenedInfo>({
  name: 'Nested Dialog Opened',
  version: 1,
  description: 'User opened a nested dialog',
})

/** When a nested dialog is closed */
export const NestedDialogClosed = defineEvent({
  name: 'Nested Dialog Closed',
  version: 2,
  description: 'User closed a nested dialog',
})

/** When an existing object in an array list is opened for editing */
export const ObjectEdited = defineEvent<ArrayListObjectInfo & {position: 'nested'}>({
  name: 'Object Edited',
  version: 1,
  description: 'User opened an existing nested object in an array list for editing',
})

interface NestedObjectOpenedInfo {
  /** How the user navigated to (opened) the nested object */
  path: 'breadcrumb' | 'close_button' | 'keyboard_shortcut'
}

/** When a nested object is navigated to (opened), regardless of trigger */
export const NestedObjectOpened = defineEvent<NestedObjectOpenedInfo>({
  name: 'Nested Object Opened',
  version: 1,
  description: 'User navigated to a nested object',
})

export const ObjectCreated = defineEvent<
  ArrayListObjectInfo & {position: 'new' | 'appended' | 'prepended'}
>({
  name: 'Object Created',
  version: 1,
  description: 'User created an object in an array list',
})

export const ObjectRemoved = defineEvent<ArrayListObjectInfo>({
  name: 'Object Removed',
  version: 1,
  description: 'User removed an object from an array list via actions',
})

interface EditorFullscreenInfo extends NestedObjectInfoOrigin {
  editor_type: 'pte'
  fullscreen: true
  location: 'nested_object_dialog'
}

export const NestedDialogEditorOpened = defineEvent<EditorFullscreenInfo>({
  name: 'Editor Opened',
  version: 1,
  description: 'User opened a fullscreen Portable Text Editor inside a nested object dialog',
})

export const NestedDialogEditorClosed = defineEvent<EditorFullscreenInfo>({
  name: 'Editor Closed',
  version: 1,
  description: 'User closed a fullscreen Portable Text Editor inside a nested object dialog',
})
