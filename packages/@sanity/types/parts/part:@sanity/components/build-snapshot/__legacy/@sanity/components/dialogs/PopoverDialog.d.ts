import React from 'react'
import {Placement} from '../types'
import {DialogAction} from './types'
interface PopoverDialogChildrenProps {
  actions?: DialogAction[]
  children: React.ReactNode
  onAction?: (action: DialogAction) => void
  onClickOutside?: () => void
  onClose?: () => void
  onEscape?: (event: KeyboardEvent) => void
  title?: string
}
interface PopoverDialogProps extends PopoverDialogChildrenProps {
  boundaryElement?: HTMLElement | null
  color?: 'default' | 'danger'
  fallbackPlacements?: Placement[]
  hasAnimation?: boolean
  padding?: 'none' | 'small' | 'medium' | 'large'
  placement?: Placement
  referenceElement?: HTMLElement | null
  size?: 'small' | 'medium' | 'large' | 'auto'
  useOverlay?: boolean
  portal?: boolean
}
declare function PopoverDialog(props: PopoverDialogProps): JSX.Element
export default PopoverDialog
