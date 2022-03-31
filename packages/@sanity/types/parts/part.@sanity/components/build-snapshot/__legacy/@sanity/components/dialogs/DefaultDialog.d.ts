import React from 'react'
import {DialogAction, DialogColor} from './types'
interface DefaultDialogProps {
  actions?: DialogAction[]
  actionsAlign?: 'start' | 'end'
  children?: React.ReactNode
  color?: DialogColor
  className?: string
  onClose?: () => void
  onEscape?: (event: KeyboardEvent) => void
  onClickOutside?: () => void
  onAction?: (action: DialogAction) => void
  padding?: 'none' | 'small' | 'medium' | 'large'
  showCloseButton?: boolean
  size?: 'small' | 'medium' | 'large' | 'auto'
  title?: string
}
declare function DefaultDialog(props: DefaultDialogProps): JSX.Element
export default DefaultDialog
