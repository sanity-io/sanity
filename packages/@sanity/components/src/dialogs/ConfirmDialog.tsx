import PropTypes from 'prop-types'
import React from 'react'
import DefaultDialog from 'part:@sanity/components/dialogs/default'
import styles from './styles/ConfirmDialog.css'

export default class ConfirmDialog extends React.PureComponent {
  static propTypes = {
    title: PropTypes.string,
    color: PropTypes.oneOf(['default', 'warning', 'success', 'danger', 'info']),
    cancelColor: PropTypes.oneOf(['primary', 'success', 'danger', 'white']),
    confirmColor: PropTypes.oneOf(['primary', 'success', 'danger', 'white']),
    children: PropTypes.node,
    onConfirm: PropTypes.func.isRequired,
    onCancel: PropTypes.func,
    confirmButtonText: PropTypes.string,
    cancelButtonText: PropTypes.string
  }

  static defaultProps = {
    confirmColor: 'danger',
    cancelColor: undefined,
    confirmButtonText: 'OK',
    cancelButtonText: 'Cancel'
  }

  handleDialogClick = event => {
    event.stopPropagation()
  }

  setDialogElement = element => {
    this.dialog = element
  }

  handleAction = (action, event) => {
    if (action.key === 'confirm') {
      this.props.onConfirm(event)
    } else {
      this.props.onCancel(event)
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

    const actions = [
      confirmButtonText && {
        key: 'confirm',
        index: 1,
        title: confirmButtonText,
        color: confirmColor,
        action: onConfirm
      },
      cancelButtonText && {
        key: 'cancel',
        index: 2,
        title: cancelButtonText,
        color: cancelColor,
        action: onCancel,
        kind: 'simple',
        secondary: true
      }
    ].filter(Boolean)

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
