import React from 'react'
import {DialogAction} from './types'
interface FullScreenDialogProps {
  cardClassName?: string
  className?: string
  title?: React.ReactNode
  children?: React.ReactNode
  onClickOutside?: () => void
  onClose?: () => void
  onEscape?: (event: KeyboardEvent) => void
  isOpen?: boolean
  onAction?: (action: DialogAction) => void
  actions?: DialogAction[]
  color?: 'default' | 'warning' | 'info' | 'success' | 'danger'
  padding?: 'none' | 'small' | 'medium' | 'large'
}
declare function FullscreenDialog(props: FullScreenDialogProps): JSX.Element
export default FullscreenDialog
