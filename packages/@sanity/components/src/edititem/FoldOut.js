import PropTypes from 'prop-types'
import React from 'react'
import styles from 'part:@sanity/components/edititem/fold-style'
import Button from 'part:@sanity/components/buttons/default'
import CloseIcon from 'part:@sanity/base/close-icon'

export default class EditItemFoldOut extends React.Component {

  static propTypes = {
    title: PropTypes.string,
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
    onClose: PropTypes.func,
    isCreatingNewItem: PropTypes.bool,
    actions: PropTypes.arrayOf(PropTypes.shape({
      kind: PropTypes.string,
      title: PropTypes.string,
      handleClick: PropTypes.func
    })),
    isOpen: PropTypes.bool,
  }

  static defaultProps = {
    onClose() {}, // eslint-disable-line
    actions: [],
    isOpen: true,
  }

  componentDidMount() {
    window.addEventListener('keydown', this.handleKeyDown)
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.handleKeyDown)
  }

  handleClose = event => {
    event.stopPropagation()
    this.props.onClose()
  }

  handleKeyDown = event => {
    if (event.key == 'Escape') {
      this.handleClose()
    }
  }

  handleRootClick = event => {
    event.stopPropagation()
  }

  setRootElement = element => {
    this._rootElement = element
  }

  render() {
    const {title, children} = this.props

    return (
      <div className={styles.root} ref={this.setRootElement} onClick={this.handleRootClick}>
        {
          title && (
            <div className={styles.head}>
              {title}
              <button className={styles.close} type="button" onClick={this.handleClose}>
                <CloseIcon />
              </button>
            </div>
          )
        }

        {
          !title && (
            <button className={styles.closeDark} type="button" onClick={this.handleClose}>
              <CloseIcon />
            </button>
          )
        }
        <div className={styles.content}>
          {children}
        </div>
      </div>
    )
  }
}
