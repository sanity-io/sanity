import PropTypes from 'prop-types'
import React from 'react'
import styles from 'part:@sanity/components/edititem/fold-style'
import CloseIcon from 'part:@sanity/base/close-icon'

export default class EditItemFoldOut extends React.PureComponent {
  static propTypes = {
    title: PropTypes.string,
    children: PropTypes.node.isRequired,
    onClose: PropTypes.func
  }

  static defaultProps = {
    title: '',
    onClose() {}, // eslint-disable-line
  }

  componentDidMount() {
    window.addEventListener('keydown', this.handleKeyDown)
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.handleKeyDown)
  }

  setRootElement = element => {
    this._rootElement = element
  }

  setPortalModalElement = element => {
    this._portalModalElement = element
  }

  render() {
    const {title, onClose, children} = this.props
    return (
      <div className={styles.root}>
        <div className={styles.wrapper}>
          {title && (
            <div className={styles.head}>
              {title}
              <button className={styles.close} type="button" onClick={onClose}>
                <CloseIcon />
              </button>
            </div>
          )}
          {!title && (
            <button className={styles.closeDark} type="button" onClick={this.handleClose}>
              <CloseIcon />
            </button>
          )}
          <div className={styles.content}>{children}</div>
        </div>
      </div>
    )
  }
}
