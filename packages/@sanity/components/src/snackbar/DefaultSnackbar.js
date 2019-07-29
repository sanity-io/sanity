import PropTypes from 'prop-types'
import React from 'react'

export default class DefaultSnackbar extends React.PureComponent {
  static propTypes = {
    kind: PropTypes.oneOf(['info', 'warning', 'error', 'success']),
    message: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    isPersisted: PropTypes.bool,
    children: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    timeout: PropTypes.number,
    onHide: PropTypes.func,
    onAction: PropTypes.func,
    action: PropTypes.shape({
      title: PropTypes.string
    }),
    actionTitle: PropTypes.string
  }

  static contextTypes = {
    addToSnackQueue: PropTypes.func,
    handleDismissSnack: PropTypes.func
  }

  componentDidMount() {
    const {
      kind,
      message,
      timeout,
      children,
      onHide,
      onAction,
      action,
      isPersisted,
      actionTitle
    } = this.props

    this.snackId = this.context.addToSnackQueue({
      kind,
      message,
      children,
      onHide,
      onAction,
      isPersisted,
      actionTitle: (action && action.title) || actionTitle,
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
