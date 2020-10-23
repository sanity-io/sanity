import React from 'react'
import DefaultDialog from 'part:@sanity/components/dialogs/default'
import styles from './ConfirmDialog.css'
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

// @todo: refactor to functional component
export default class ConfirmDialog extends React.PureComponent<ConfirmDialogProps> {
  handleAction = (action: DialogAction) => {
    if (action.key === 'confirm') {
      this.props.onConfirm()
    } else if (this.props.onCancel) {
      this.props.onCancel()
    }
  }

  render() {
    const {
      cancelButtonText = 'Cancel',
      cancelColor,
      confirmColor,
      confirmButtonText = 'OK',
      onCancel,
      onConfirm,
      ...restProps
    } = this.props

    const cancelAction: DialogAction | null = cancelButtonText
      ? {
          key: 'cancel',
          index: 2,
          title: cancelButtonText,
          color: cancelColor,
          action: onCancel,
          kind: 'simple',
          secondary: true,
        }
      : null

    const confirmAction: DialogAction | null = confirmButtonText
      ? {
          key: 'confirm',
          index: 1,
          title: confirmButtonText,
          color: confirmColor,
          action: onConfirm,
        }
      : null

    const actions = [confirmAction, cancelAction].filter(Boolean) as DialogAction[]

    return (
      <DefaultDialog
        {...restProps}
        actions={actions}
        showCloseButton={false}
        onEscape={this.props.onCancel}
        onAction={this.handleAction}
      >
        <div className={styles.content}>{this.props.children}</div>
      </DefaultDialog>
    )
  }
}
