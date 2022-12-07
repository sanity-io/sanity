import {Path, PortableTextBlock, PortableTextObject, PortableTextTextBlock} from '@sanity/types'

/** @alpha */
export interface BlockDecoratorProps {
  children: React.ReactElement
  focused: boolean
  renderDefault: (props: BlockDecoratorProps) => React.ReactElement
  selected: boolean
  title: string
  value: string
}

/** @alpha */
export interface BlockStyleProps {
  block: PortableTextTextBlock
  children: React.ReactElement
  focused: boolean
  renderDefault: (props: BlockStyleProps) => React.ReactElement
  selected: boolean
  title: string
  value: string
}

/** @alpha */
export interface BlockListItemProps {
  block: PortableTextTextBlock
  children: React.ReactElement
  focused: boolean
  level: number
  renderDefault: (props: BlockListItemProps) => React.ReactElement
  selected: boolean
  title: string
  value: string
}

/** @alpha */
export interface BlockAnnotationProps {
  children: React.ReactElement
  focused: boolean
  onClose: () => void
  onOpen: () => void
  onRemove: () => void
  open: boolean
  path: Path
  renderDefault: (props: BlockAnnotationProps) => React.ReactElement
  selected: boolean
  value: PortableTextObject
}

/** @alpha */
export interface BlockProps {
  children: React.ReactElement
  focused: boolean
  onClose: () => void
  onOpen: () => void
  onRemove: () => void
  open: boolean
  path: Path
  renderDefault: (props: BlockProps) => React.ReactElement
  selected: boolean
  value: PortableTextBlock
}
