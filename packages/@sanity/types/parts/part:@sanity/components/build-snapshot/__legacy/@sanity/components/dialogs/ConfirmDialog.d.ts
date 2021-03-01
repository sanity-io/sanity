import React from 'react'
import {DialogAction, DialogColor} from './types'
interface ConfirmDialogProps {
  cancelButtonText?: string
  cancelColor?: 'primary' | 'success' | 'danger' | 'white'
  children?: React.ReactNode
  color?: DialogColor
  confirmButtonText?: string
  confirmColor?: 'primary' | 'success' | 'danger' | 'white'
  onCancel?: () => void
  onConfirm: () => void
  title?: string
}
export default class ConfirmDialog extends React.PureComponent<ConfirmDialogProps> {
  handleAction: (action: DialogAction) => void
  render(): JSX.Element
}
export {}
