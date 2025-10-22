import {defineEvent} from '@sanity/telemetry'

interface NestedDialogOpenedInfo {
  path: string
}

interface NestedObjectInfoOrigin extends NestedDialogOpenedInfo {
  origin: 'default' | 'nested-object'
}

/**
 * When a nested dialoge dialoge is opened
 */
export const NestedDialogOpened = defineEvent<NestedDialogOpenedInfo>({
  name: 'Nested Dialog Opened',
  version: 1,
  description: 'User opened a nested dialog',
})

/** When a nested dialog is successfully closed */
export const NestedDialogClosed = defineEvent<NestedDialogOpenedInfo>({
  name: 'Nested Dialog Closed',
  version: 1,
  description: 'User closed a nested dialog',
})

/** When a nested object is edited */
export const NavigatedToViaArrayList = defineEvent<NestedDialogOpenedInfo & NestedObjectInfoOrigin>(
  {
    name: 'Edited Nested Object in Array List',
    version: 1,
    description:
      'User edited a object - meaning a navigation to a nested object was made through the array list',
  },
)

export const NavigatedToNestedObjectViaBreadcrumb = defineEvent<NestedDialogOpenedInfo>({
  name: 'Navigated to Nested Object via Breadcrumb',
  version: 1,
  description: 'User navigated to a nested object via a breadcrumb',
})

export const CreatedNewObject = defineEvent<NestedDialogOpenedInfo & NestedObjectInfoOrigin>({
  name: 'Created New Object in Array List',
  version: 1,
  description: 'User created a new object in an array list',
})

export const CreatePrependedObject = defineEvent<NestedDialogOpenedInfo & NestedObjectInfoOrigin>({
  name: 'Created Prepended Object in Array List',
  version: 1,
  description: 'User created a prepended object in an array list',
})

export const CreateAppendedObject = defineEvent<NestedDialogOpenedInfo & NestedObjectInfoOrigin>({
  name: 'Created Appended Object in Array List',
  version: 1,
  description: 'User created an appended object in an array list',
})

export const EditedObject = defineEvent<NestedDialogOpenedInfo & NestedObjectInfoOrigin>({
  name: 'Edited Object in Array List',
  version: 1,
  description: 'User edited a object in an array list',
})

export const RemovedObject = defineEvent<NestedDialogOpenedInfo & NestedObjectInfoOrigin>({
  name: 'Removed Object in Array List',
  version: 1,
  description: 'User removed a object from an array list via actions',
})

export const OpenedPortableTextEditorFullScreen = defineEvent<
  NestedDialogOpenedInfo & NestedObjectInfoOrigin
>({
  name: 'Opened Portable Text Editor Full Screen in Nested Object Dialog',
  version: 1,
  description: 'User opened a portable text editor in full screen mode in a object dialog',
})

export const ClosedPortableTextEditorFullScreen = defineEvent<
  NestedDialogOpenedInfo & NestedObjectInfoOrigin
>({
  name: 'Closed Portable Text Editor Full Screen in Nested Object Dialog',
  version: 1,
  description: 'User closed a portable text editor in full screen mode in a object dialog',
})
