import PropTypes from 'prop-types'
import React from 'react'
import styles from 'part:@sanity/components/snackbar/default-style'
import Button from 'part:@sanity/components/buttons/default'

export default class DefaultSnackbar extends React.PureComponent {
  static propTypes = {
    kind: PropTypes.oneOf(['danger', 'info', 'warning', 'error', 'success']),
    children: PropTypes.node.isRequired,
    timeout: PropTypes.number,
    onAction: PropTypes.func,
    action: PropTypes.shape({
      title: PropTypes.string
    })
  }

  static defaultProps = {
    kind: 'info',
    timeout: 0,
  }

  constructor(props, context) {
    super(props, context)
    this.state = {
      visible: true,
    }
  }

  componentDidMount() {
    this.scheduleHide()
  }

  hide = () => {
    this.setState({visible: false})
  }

  show = () => {
    this.setState({visible: true})
  }

  cancelHide() {
    clearTimeout(this._timerId)
  }

  scheduleHide() {
    const {timeout} = this.props
    this.cancelHide()
    if (timeout > 0) {
      this._timerId = setTimeout(this.hide, timeout * 1000)
    }
  }

  componentWillUnmount() {
    this.cancelHide()
  }

  componentDidUpdate(prevProps) {
    if (prevProps.timeout !== this.props.timeout) {
      this.scheduleHide()
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.timeout !== this.props.timeout) {
      this.show()
    }
  }

  handleAction = () => {
    this.props.onAction(this.props.action)
  }

  handleMouseOver = () => {
    this.cancelHide()
  }

  handleMouseLeave = () => {
    this.scheduleHide()
  }

  render() {

    const {kind, action, children} = this.props

    const style = `${styles[kind] || styles.root} ${this.state.visible ? styles.visible : styles.hidden}`

    return (
      <div className={style}>
        <div className={styles.inner} onMouseOver={this.handleMouseOver} onMouseLeave={this.handleMouseLeave}>
          {action && (
            <div className={styles.action}>
              <Button inverted color="white" onClick={this.handleAction}>{action.title}</Button>
            </div>
          )}
          <div className={styles.content}>
            {children}
          </div>
        </div>
      </div>
    )
  }
}
