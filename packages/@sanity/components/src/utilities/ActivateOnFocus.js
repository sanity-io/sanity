import classNames from 'classnames'
import PropTypes from 'prop-types'
import React from 'react'
import styles from './styles/ActivateOnFocus.css'
import enhanceWithClickOutside from 'react-click-outside'

class ActivateOnFocus extends React.Component {
  static propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
    message: PropTypes.string,
    html: PropTypes.node,
    isActive: PropTypes.bool,
    onActivate: PropTypes.func,
    inputId: PropTypes.string
  }

  static defaultProps = {
    className: undefined,
    message: 'Click to activate…',
    isActive: false
  }

  state = {
    hasFocus: false
  }

  handleClick = event => {
    if (!this.state.hasFocus) {
      this.setState({
        hasFocus: true
      })
      const {onActivate} = this.props
      if (onActivate) {
        onActivate()
      }
    }
  }

  handleClickOutside = () => {
    if (this.state.hasFocus) {
      this.setState({
        hasFocus: false
      })
    }
  }

  render() {
    const {
      className: classNameProp,
      message,
      children,
      isActive,
      html,
      overlayClassName: overlayClassNameProp,
      inputId
    } = this.props
    const {hasFocus} = this.state
    const className = classNames(hasFocus ? styles.hasFocus : styles.noFocus, classNameProp)
    const overlayClassName = classNames(styles.overlay, overlayClassNameProp)

    return (
      <div className={className} id={inputId}>
        {!isActive && (
          <div className={styles.eventHandler} onClick={this.handleClick}>
            <div className={overlayClassName}>
              {!html && <div className={styles.stringMessage}>{message}</div>}
              {html && <div className={styles.html}>{html}</div>}
            </div>
          </div>
        )}
        <div className={styles.content}>{children}</div>
      </div>
    )
  }
}

export default enhanceWithClickOutside(ActivateOnFocus)
