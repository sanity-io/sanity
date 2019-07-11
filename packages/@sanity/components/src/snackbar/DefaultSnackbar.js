import PropTypes from 'prop-types'
import React from 'react'

export default class DefaultSnackbar extends React.PureComponent {
  static propTypes = {
    kind: PropTypes.oneOf(['danger', 'info', 'warning', 'error', 'success']),
    message: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    persist: PropTypes.bool,
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
    addToSnackQueue: PropTypes.func
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
      persist,
      actionTitle
    } = this.props

    this.context.addToSnackQueue({
      kind,
      message,
      children,
      onHide,
      onAction,
      persist,
      actionTitle: (action && action.title) || actionTitle,
      autoDismissTimeout: timeout
    })
  }

  render() {
    return <div />
  }
}
