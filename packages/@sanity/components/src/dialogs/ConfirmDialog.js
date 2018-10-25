import PropTypes from 'prop-types'
import React from 'react'
import DefaultDialog from 'part:@sanity/components/dialogs/default'
import styles from './styles/ConfirmDialog.css'
import Button from 'part:@sanity/components/buttons/default'

export default class ConfirmDialog extends React.PureComponent {
  static propTypes = {
    title: PropTypes.string,
    color: PropTypes.oneOf(['warning', 'success', 'danger', 'info']),
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
    cancelColor: 'default',
    confirmButtonText: 'OK',
    cancelButtonText: 'Cancel'
  }

  handleDialogClick = event => {
    event.stopPropagation()
  }

  setDialogElement = element => {
    this.dialog = element
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
      {
        index: 1,
        title: confirmButtonText,
        color: confirmColor,
        action: onConfirm
      },
      {
        index: 2,
        title: cancelButtonText,
        color: cancelColor,
        action: onCancel,
        kind: 'simple',
        secondary: true
      }
    ]

    return (
      <DefaultDialog color={color} actions={actions} title={title}>
        <div className={styles.content}>{this.props.children}</div>
      </DefaultDialog>
    )
  }
}
