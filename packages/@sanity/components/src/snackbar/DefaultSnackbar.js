import PropTypes from 'prop-types'
import React from 'react'

export default class DefaultSnackbar extends React.PureComponent {
  static propTypes = {
    kind: PropTypes.oneOf(['info', 'warning', 'error', 'success']),
    message: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    isPersisted: PropTypes.bool,
    children: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    onClose: PropTypes.func,
    action: PropTypes.shape({
      // Title is also a legacy prop
      title: PropTypes.string,
      callback: PropTypes.func
    }),
    // Legacy props
    onAction: PropTypes.func,
    actionTitle: PropTypes.string,
    timeout: PropTypes.number
  }

  static contextTypes = {
    addToSnackQueue: PropTypes.func,
    handleDismissSnack: PropTypes.func
  }

  componentDidMount() {
    const {
      action,
      actionTitle,
      kind,
      message,
      timeout,
      children,
      onClose,
      onAction,
      isPersisted
    } = this.props

    this.snackId = this.context.addToSnackQueue({
      kind,
      message,
      children,
      onClose,
      action: {
        title: actionTitle || action.title,
        callback: onAction || action.callback
      },
      isPersisted,
      autoDismissTimeout: timeout
    })
  }

  componentWillUnmount() {
    this.context.handleDismissSnack(this.snackId)
  }

  render() {
    return <div />
  }
}
