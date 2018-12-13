import PropTypes from 'prop-types'
import React from 'react'
import styles from './styles/ActivateOnFocus.css'
import enhanceWithClickOutside from 'react-click-outside'

class ActivateOnFocus extends React.Component {
  static propTypes = {
    children: PropTypes.node.isRequired,
    message: PropTypes.string,
    html: PropTypes.node,
    isActive: PropTypes.bool,
    onActivate: PropTypes.func
  }

  static defaultProps = {
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
    const {message, children, isActive, html} = this.props
    const {hasFocus} = this.state

    return (
      <div className={hasFocus ? styles.hasFocus : styles.noFocus}>
        {!isActive && (
          <div className={styles.eventHandler} onClick={this.handleClick}>
            <div className={styles.overlay} />
            {!html && <div className={styles.stringMessage}>{message}</div>}
            {html && <div className={styles.html}>{html}</div>}
          </div>
        )}
        <div className={styles.content}>{children}</div>
      </div>
    )
  }
}

export default enhanceWithClickOutside(ActivateOnFocus)
