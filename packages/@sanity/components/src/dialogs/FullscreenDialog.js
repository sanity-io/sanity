import React, {PropTypes} from 'react'

import styles from 'part:@sanity/components/dialogs/fullscreen-style'
import CloseIcon from 'part:@sanity/base/close-icon'
import Portal from 'react-portal'

export default class FullScreenDialog extends React.PureComponent {
  static propTypes = {
    kind: PropTypes.oneOf(['default', 'warning', 'info', 'success', 'danger']),
    className: PropTypes.string,
    title: PropTypes.string,
    children: PropTypes.node,
    onClose: PropTypes.func,
    isOpen: PropTypes.bool,
    centered: PropTypes.bool
  }

  static defaultProps = {
    kind: 'default'
  }

  componentDidMount() {
    window.addEventListener('keydown', this.handleKeyDown, false)
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.handleKeyDown, false)
  }

  handleKeyDown = event => {
    if (event.key === 'Escape' && this.isClosable()) {
      this.props.onClose()
    }
  }

  isClosable() {
    return typeof this.props.onClose === 'function'
  }

  render() {
    const {kind, title, className, onClose, centered, isOpen} = this.props

    const classNames = [
      styles[kind] || styles.default,
      isOpen ? styles.isOpen : styles.isClosed,
      className,
      centered && styles.centered
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <Portal closeOnEsc={this.isClosable()} isOpened={isOpen} onClose={onClose}>
        <div className={classNames}>
          {
            onClose && (
              <button className={styles.closeButton} onClick={onClose}>
                <CloseIcon color="inherit" />
              </button>
            )
          }
          <div className={styles.inner}>
            <h1 className={styles.heading}>{title}</h1>
            <div className={styles.content}>
              {this.props.children}
            </div>
          </div>
        </div>
      </Portal>
    )
  }
}
