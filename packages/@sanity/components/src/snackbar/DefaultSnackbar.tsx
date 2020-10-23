import PropTypes from 'prop-types'
import React from 'react'
import {SnackbarAction} from './types'

interface DefaultSnackbarProps {
  kind?: 'info' | 'warning' | 'error' | 'success'
  title?: React.ReactNode
  subtitle?: React.ReactNode
  isPersisted?: boolean
  isCloseable?: boolean
  children?: React.ReactNode
  onClose?: () => void
  action?: SnackbarAction

  // Legacy props
  onAction?: () => void
  actionTitle?: string
  timeout?: number
  allowDuplicateSnackbarType?: boolean
}

export default class DefaultSnackbar extends React.PureComponent<DefaultSnackbarProps> {
  static contextTypes = {
    addToSnackQueue: PropTypes.func,
    handleDismissSnack: PropTypes.func,
    updateSnack: PropTypes.func,
  }

  snackId?: string

  componentDidMount() {
    if (!this.context.addToSnackQueue) {
      // eslint-disable-next-line no-console
      console.warn('The snackbar is not wrapped in SnackbarProvider')
      return
    }

    this.snackId = this.context.addToSnackQueue(this.getSnackOptions())
  }

  getSnackOptions() {
    const {
      action: actionProp,
      actionTitle,
      kind,
      title,
      subtitle,
      timeout,
      children,
      onClose,
      onAction,
      isPersisted,
      isCloseable,
      allowDuplicateSnackbarType,
    } = this.props

    const action = (actionTitle || onAction) && {
      title: actionTitle || actionProp?.title,
      callback: onAction || actionProp?.callback,
    }

    return {
      kind,
      title,
      subtitle,
      children,
      onClose,
      action,
      isPersisted,
      isCloseable,
      autoDismissTimeout: timeout,
      allowDuplicateSnackbarType,
    }
  }

  componentWillUnmount() {
    if (!this.context.handleDismissSnack) {
      // eslint-disable-next-line no-console
      console.warn('The snackbar is not wrapped in SnackbarProvider')
      return
    }

    this.context.handleDismissSnack(this.snackId)
  }

  componentDidUpdate() {
    if (!this.context.updateSnack) {
      // eslint-disable-next-line no-console
      console.warn('The snackbar is not wrapped in SnackbarProvider')
      return
    }

    this.context.updateSnack(this.snackId, this.getSnackOptions())
  }

  // eslint-disable-next-line class-methods-use-this
  render() {
    return null
  }
}
