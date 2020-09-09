import React from 'react'
import DefaultDialog from 'part:@sanity/components/dialogs/default'
import styles from './ConfirmDialog.css'
import {DialogAction} from './types'

interface ConfirmDialogProps {
  title?: string
  color?: 'default' | 'warning' | 'success' | 'danger' | 'info'
  cancelColor?: 'primary' | 'success' | 'danger' | 'white'
  confirmColor?: 'primary' | 'success' | 'danger' | 'white'
  children?: React.ReactNode
  onConfirm: () => void
  onCancel?: () => void
  confirmButtonText?: string
  cancelButtonText?: string
}

export default class ConfirmDialog extends React.PureComponent<ConfirmDialogProps> {
  static defaultProps = {
    confirmColor: 'danger',
    cancelColor: undefined,
    confirmButtonText: 'OK',
    cancelButtonText: 'Cancel'
  }

  handleAction = (action: DialogAction) => {
    if (action.key === 'confirm') {
      this.props.onConfirm()
    } else if (this.props.onCancel) {
      this.props.onCancel()
    }
  }

  render() {
    const {
      color,
      confirmColor,
      cancelColor,
      confirmButtonText,
      cancelButtonText,
      onConfirm,
      onCancel,
      title
    } = this.props

    const cancelAction: DialogAction | null = cancelButtonText
      ? {
          key: 'cancel',
          index: 2,
          title: cancelButtonText,
          color: cancelColor,
          action: onCancel,
          kind: 'simple',
          secondary: true
        }
      : null

    const confirmAction: DialogAction | null = confirmButtonText
      ? {
          key: 'confirm',
          index: 1,
          title: confirmButtonText,
          color: confirmColor,
          action: onConfirm
        }
      : null

    const actions = [confirmAction, cancelAction].filter(Boolean) as DialogAction[]

    return (
      <DefaultDialog
        color={color}
        actions={actions}
        title={title}
        showCloseButton={false}
        onEscape={this.props.onCancel}
        onAction={this.handleAction}
      >
        <div className={styles.content}>{this.props.children}</div>
      </DefaultDialog>
    )
  }
}
