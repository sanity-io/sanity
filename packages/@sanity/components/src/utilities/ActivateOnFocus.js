import PropTypes from 'prop-types'
import React from 'react'
import styles from './styles/ActivateOnFocus.css'
import enhanceWithClickOutside from 'react-click-outside'

class ActivateOnFocus extends React.Component {
  static propTypes = {
    children: PropTypes.node.isRequired,
    message: PropTypes.string,
    enableBlur: PropTypes.bool,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
  }

  static defaultProps = {
    enableBlur: true,
    message: 'Click to activate…',
    onFocus() {},
    onBlur() {},
  }

  state = {
    hasFocus: false
  }

  setEventHandlerElement = element => {
    this._eventHandlerElement = element
  }

  handleClick = event => {
    if (!this.state.hasFocus) {
      this.setState({
        hasFocus: true
      })
      this.props.onFocus()
    }
  }

  handleClickOutside = () => {
    if (this.state.hasFocus) {
      this.setState({
        hasFocus: false
      })
      this.props.onBlur()
    }
  }

  handleFocus = event => {
    this.setState({
      hasFocus: true
    })
    this.props.onFocus()
  }

  handleBlur = event => {
    const {enableBlur} = this.props
    if (enableBlur) {
      this.setState({
        hasFocus: false
      })
    }
    this.props.onBlur()
  }

  render() {
    const {message, children} = this.props
    const {hasFocus} = this.state
    return (
      <div
        className={hasFocus ? styles.hasFocus : styles.noFocus}
        onFocus={this.handleFocus}
        onBlur={this.handleBlur}
      >
        <div
          className={styles.eventHandler}
          onClick={this.handleClick}
        >
          <div className={styles.overlay} />
          <div className={styles.message}>{message}</div>
        </div>
        <div className={styles.content}>
          {children}
        </div>
      </div>
    )
  }
}

export default enhanceWithClickOutside(ActivateOnFocus)
