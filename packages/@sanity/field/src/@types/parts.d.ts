// declare module 'part:*'

declare module 'part:@sanity/base/authentication-fetcher'
declare module 'part:@sanity/base/client'
declare module 'part:@sanity/base/preview'
declare module 'part:@sanity/base/user'

declare module 'all:part:@sanity/base/diff-resolver' {
  import {ComponentType} from 'react'

  type DiffComponentResolver = (options: {schemaType: any}) => ComponentType | undefined

  const parts: DiffComponentResolver[]
  export default parts
}

declare module 'part:@sanity/base/arrow-right' {
  const ArrowRightIcon: React.ComponentType<{}>
  export default ArrowRightIcon
}

declare module 'part:@sanity/base/file-icon' {
  const FileIcon: React.ComponentType<{}>
  export default FileIcon
}

declare module 'part:@sanity/base/image-icon' {
  const ImageIcon: React.ComponentType<{}>
  export default ImageIcon
}

declare module 'part:@sanity/base/link-icon' {
  const LinkIcon: React.ComponentType<{}>
  export default LinkIcon
}

declare module 'part:@sanity/base/trash-icon' {
  const TrashIcon: React.ComponentType<{}>
  export default TrashIcon
}

declare module 'part:@sanity/base/undo-icon' {
  const UndoIcon: React.ComponentType<{}>
  export default UndoIcon
}

declare module 'part:@sanity/components/avatar' {
  export * from '@sanity/components/src/avatar'
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

declare module 'part:@sanity/components/tooltip' {
  export * from '@sanity/components/src/tooltip'
}
