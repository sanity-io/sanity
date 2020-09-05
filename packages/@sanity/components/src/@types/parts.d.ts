/* eslint-disable import/export */

declare module 'part:@sanity/base/router' {
  export * from '@sanity/base/src/router'
}

declare module 'part:@sanity/base/check-icon' {
  export {default} from '@sanity/base/src/components/icons/Check'
}

declare module 'part:@sanity/base/cog-icon' {
  export {default} from '@sanity/base/src/components/icons/Cog'
}

declare module 'part:@sanity/base/error-outline-icon' {
  export {default} from '@sanity/base/src/components/icons/ErrorOutline'
}

declare module 'part:@sanity/base/link-icon' {
  export {default} from '@sanity/base/src/components/icons/Link'
}

declare module 'part:@sanity/base/close-icon' {
  export {default} from '@sanity/base/src/components/icons/CloseIcon'
}

declare module 'part:@sanity/base/users-icon' {
  export {default} from '@sanity/base/src/components/icons/UsersIcon'
}

declare module 'part:@sanity/components/buttons/default' {
  const DefaultButton: React.ComponentClass<{
    kind?: 'simple' | 'secondary'
    color?: 'primary' | 'success' | 'danger' | 'white' | 'warning'
    onBlur?: () => void
    onClick?: () => void
    children?: React.ReactNode
    inverted?: boolean
    icon?: React.ComponentType<{}>
    loading?: boolean
    className?: string
    disabled?: boolean
    tabIndex?: number
    padding?: 'large' | 'default' | 'small' | 'none'
    bleed?: boolean
    selected?: boolean
    size?: 'extra-small' | 'small' | 'medium' | 'large' | 'extra-large'
  }>

  export default DefaultButton
}

///////////////////////////////////////////////////////////////////////////////////////////////////
// Because `@sanity/components` depends on `@sanity/base` we need these "ambient" definitions
///////////////////////////////////////////////////////////////////////////////////////////////////
declare module 'part:@sanity/base/client'
declare module 'part:@sanity/base/authentication-fetcher'
declare module 'part:@sanity/base/user'
