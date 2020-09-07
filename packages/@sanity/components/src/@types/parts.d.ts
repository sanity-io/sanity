/* eslint-disable import/export */

declare module 'part:@sanity/components/buttons/button-grid-style'
declare module 'part:@sanity/components/buttons/default-style'
declare module 'part:@sanity/components/buttons/dropdown-style'
declare module 'part:@sanity/components/buttons/in-input-style'
declare module 'part:@sanity/components/fileinput/button'
declare module 'part:@sanity/components/loading/spinner-style'
declare module 'part:@sanity/components/previews/block-image-style'
declare module 'part:@sanity/components/previews/block-style'
declare module 'part:@sanity/components/previews/card-style'
declare module 'part:@sanity/components/previews/default-style'
declare module 'part:@sanity/components/previews/detail-style'
declare module 'part:@sanity/components/previews/inline-style'
declare module 'part:@sanity/components/previews/media-style'
declare module 'part:@sanity/components/progress/bar-style'
declare module 'part:@sanity/components/progress/circle-style'

// @todo
declare module 'part:@sanity/components/lists/default'
declare module 'part:@sanity/components/utilities/poppable'

declare module 'part:@sanity/base/router' {
  export * from '@sanity/base/src/router'
}

declare module 'part:@sanity/base/angle-down-icon' {
  export {default} from '@sanity/base/src/components/icons/AngleDownIcon'
}

declare module 'part:@sanity/base/bars-icon' {
  export {default} from '@sanity/base/src/components/icons/Bars'
}

declare module 'part:@sanity/base/check-icon' {
  export {default} from '@sanity/base/src/components/icons/Check'
}

declare module 'part:@sanity/base/close-icon' {
  export {default} from '@sanity/base/src/components/icons/CloseIcon'
}

declare module 'part:@sanity/base/compose-icon' {
  export {default} from '@sanity/base/src/components/icons/Compose'
}

declare module 'part:@sanity/base/drag-handle-icon' {
  export {default} from '@sanity/base/src/components/icons/DragHandle'
}

declare module 'part:@sanity/base/error-outline-icon' {
  export {default} from '@sanity/base/src/components/icons/ErrorOutline'
}

declare module 'part:@sanity/base/file-icon' {
  export {default} from '@sanity/base/src/components/icons/File'
}

declare module 'part:@sanity/base/link-icon' {
  export {default} from '@sanity/base/src/components/icons/Link'
}

declare module 'part:@sanity/base/sanity-logo-icon' {
  export {default} from '@sanity/base/src/components/icons/SanityLogo'
}

declare module 'part:@sanity/base/spinner-icon' {
  export {default} from '@sanity/base/src/components/icons/SpinnerIcon'
}

declare module 'part:@sanity/base/trash-icon' {
  export {default} from '@sanity/base/src/components/icons/Trash'
}

declare module 'part:@sanity/base/users-icon' {
  export {default} from '@sanity/base/src/components/icons/UsersIcon'
}

declare module 'part:@sanity/base/warning-icon' {
  export {default} from '@sanity/base/src/components/icons/Warning'
}

///////////////////////////////////////////////////////////////////////////////////////////////////
// Because `@sanity/components` depends on `@sanity/base` we need these "ambient" definitions
///////////////////////////////////////////////////////////////////////////////////////////////////
declare module 'part:@sanity/base/client'
declare module 'part:@sanity/base/authentication-fetcher'
declare module 'part:@sanity/base/user'
