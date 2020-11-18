import classNames from 'classnames'
import React from 'react'
import enhanceWithClickOutside from 'react-click-outside'

import styles from './ActivateOnFocus.css'

interface ActivateOnFocusProps {
  children: React.ReactNode
  className?: string
  message?: string
  html?: React.ReactNode
  isActive?: boolean
  onActivate?: () => void
  overlayClassName?: string
  inputId?: string
}

// @todo: refactor to functional component
class ActivateOnFocus extends React.Component<ActivateOnFocusProps> {
  static defaultProps = {
    className: undefined,
    message: 'Click to activate…',
    isActive: false,
  }

  state = {
    hasFocus: false,
  }

  handleClick = () => {
    if (!this.state.hasFocus) {
      this.setState({
        hasFocus: true,
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
        hasFocus: false,
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
      inputId,
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
