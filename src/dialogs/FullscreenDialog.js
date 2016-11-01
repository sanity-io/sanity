import React, {PropTypes} from 'react'

import styles from 'part:@sanity/components/dialogs/fullscreen-style'
import CloseIcon from 'part:@sanity/base/close-icon'

export default class FullScreenDialog extends React.Component {
  static propTypes = {
    kind: PropTypes.oneOf(['default', 'warning', 'info', 'success', 'danger']),
    className: PropTypes.string,
    title: PropTypes.string,
    children: PropTypes.node,
    onClose: PropTypes.func.isRequired,
    isOpen: PropTypes.bool,
    centered: PropTypes.bool
  }

  static defaultProps = {
    kind: 'default'
  }

  render() {

    const {kind, title, className, onClose, centered} = this.props

    const style = `
      ${styles[kind]}
      ${this.props.isOpen ? styles.isOpen : styles.isClosed}
      ${className}
      ${centered && styles.centered}
    `

    return (
      <div className={style}>
        <button className={styles.closeButton} onClick={onClose}>
          <CloseIcon color="inherit" />
        </button>
        <div className={styles.inner}>
          {
            title && <h1 className={styles.heading}>{title}</h1>
          }
          <div className={styles.content}>
            {this.props.children}
          </div>
        </div>
      </div>
    )
  }
}
