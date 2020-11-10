/* eslint-disable import/export */

declare module 'part:@sanity/base/authentication-fetcher'
declare module 'part:@sanity/base/client'
declare module 'part:@sanity/base/user'

// used by @sanity/react-hooks
declare module 'part:@sanity/base/datastore/document'

declare module 'part:@sanity/base/preview' {
  import {Observable} from 'rxjs'

  const PreviewBase: React.ComponentType<{
    type?: object // Schema type
    fields?: string[]
    value: any
    children?: (props: any) => React.ComponentType
    layout: 'inline' | 'block' | 'default' | 'card' | 'media'
  }>

  type previewObserver = (
    value: Reference | string,
    schemaType: object
  ) => Observable<{snapshot: {title: string}}>

  export const observeForPreview: previewObserver
  export default PreviewBase
}

declare module 'part:@sanity/base/schema' {
  interface Schema {
    get(typeName: string): unknown
  }
  const schema: Schema
  export default schema
}

declare module 'all:part:@sanity/base/diff-resolver' {
  import {ComponentType} from 'react'

  type DiffComponentResolver = (options: {
    schemaType: any
    parentSchemaType?: any
  }) => ComponentType | undefined

  const parts: DiffComponentResolver[]
  export default parts
}

declare module 'part:@sanity/base/arrow-right' {
  const ArrowRightIcon: React.ComponentType
  export default ArrowRightIcon
}

declare module 'part:@sanity/base/chevron-down-icon' {
  export {default} from '@sanity/base/src/components/icons/ChevronDown'
}

declare module 'part:@sanity/base/close-icon' {
  export {default} from '@sanity/base/src/components/icons/CloseIcon'
}

declare module 'part:@sanity/base/warning-outline-icon' {
  export {default} from '@sanity/base/src/components/icons/WarningOutline'
}

declare module 'part:@sanity/base/file-icon' {
  const FileIcon: React.ComponentType
  export default FileIcon
}

declare module 'part:@sanity/base/image-icon' {
  const ImageIcon: React.ComponentType
  export default ImageIcon
}

declare module 'part:@sanity/base/link-icon' {
  const LinkIcon: React.ComponentType
  export default LinkIcon
}

declare module 'part:@sanity/base/spinner-icon' {
  export {default} from '@sanity/base/src/components/icons/SpinnerIcon'
}

declare module 'part:@sanity/base/trash-icon' {
  const TrashIcon: React.ComponentType
  export default TrashIcon
}

declare module 'part:@sanity/base/undo-icon' {
  const UndoIcon: React.ComponentType
  export default UndoIcon
}

declare module 'part:@sanity/base/error-outline-icon' {
  const ErrorOutlineIcon: React.ComponentType
  export default ErrorOutlineIcon
}

declare module 'part:@sanity/components/avatar' {
  export * from '@sanity/components/src/avatar'
}

declare module 'part:@sanity/components/buttons/button-grid'
declare module 'part:@sanity/components/buttons/default-style'
declare module 'part:@sanity/components/buttons/default' {
  export * from '@sanity/components/src/buttons/DefaultButton'
  export {default} from '@sanity/components/src/buttons/DefaultButton'
}

declare module 'part:@sanity/components/click-outside' {
  export * from '@sanity/components/src/clickOutside'
}

declare module 'part:@sanity/components/dialogs/popover-style'
declare module 'part:@sanity/components/dialogs/popover' {
  export {default} from '@sanity/components/src/dialogs/PopoverDialog'
}

declare module 'part:@sanity/components/layer' {
  export * from '@sanity/components/src/layer'
}

declare module 'part:@sanity/components/loading/spinner-style'
declare module 'part:@sanity/components/loading/spinner' {
  export {default} from '@sanity/components/src/loading/Spinner'
}

declare module 'part:@sanity/components/popover' {
  export * from '@sanity/components/src/popover'
}

declare module 'part:@sanity/components/portal' {
  export * from '@sanity/components/src/portal'
}

declare module 'part:@sanity/components/tooltip' {
  export * from '@sanity/components/src/tooltip'
}
