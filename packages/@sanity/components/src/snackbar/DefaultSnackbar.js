import PropTypes from 'prop-types'
import React from 'react'

export default class DefaultSnackbar extends React.PureComponent {
  static propTypes = {
    kind: PropTypes.oneOf(['info', 'warning', 'error', 'success']),
    title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    subtitle: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    isPersisted: PropTypes.bool,
    isCloseable: PropTypes.bool,
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
    timeout: PropTypes.number,
    preventDuplicate: PropTypes.bool
  }

  static contextTypes = {
    addToSnackQueue: PropTypes.func,
    handleDismissSnack: PropTypes.func,
    updateSnack: PropTypes.func
  }

  componentDidMount() {
    this.snackId = this.context.addToSnackQueue(this.getSnackOptions())
  }

  getSnackOptions() {
    const {
      action,
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
      preventDuplicate
    } = this.props

    return {
      kind,
      title,
      subtitle,
      children,
      onClose,
      action: {
        title: actionTitle || (action && action.title),
        callback: onAction || (action && action.callback)
      },
      isPersisted,
      isCloseable,
      autoDismissTimeout: timeout,
      preventDuplicate
    }
  }

  componentWillUnmount() {
    this.context.handleDismissSnack(this.snackId)
  }

  componentDidUpdate() {
    this.context.updateSnack(this.snackId, this.getSnackOptions())
  }

  render() {
    return null
  }
}
