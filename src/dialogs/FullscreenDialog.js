import React, {PropTypes} from 'react'

import styles from 'style:@sanity/components/dialogs/fullscreen'
import CloseIcon from 'icon:@sanity/close'

export default class FullScreenDialog extends React.Component {
  static propTypes = {
    kind: PropTypes.oneOf(['warning', 'success', 'danger']),
    className: PropTypes.string,
    title: PropTypes.string.isRequired,
    children: PropTypes.node,
    onClose: PropTypes.func.isRequired,
    isOpen: PropTypes.bool
  }

  render() {

    const {kind, title, className, onClose} = this.props

    const style = `${styles[kind] || styles.root} ${className} ${this.props.isOpen ? styles.isOpen : styles.isClosed}`

    return (
      <div className={style}>
        <button className={styles.closeButton} onClick={onClose}>
          <CloseIcon color="inherit" />
        </button>
        <div className={styles.inner}>
          <h1 className={styles.heading}>{title}</h1>
          <div className={styles.content}>
            {this.props.children}
          </div>
        </div>
      </div>
    )
  }
}
