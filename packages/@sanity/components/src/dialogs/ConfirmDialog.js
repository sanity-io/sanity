import PropTypes from 'prop-types'
import React from 'react'

import CloseIcon from 'part:@sanity/base/close-icon'
import CheckIcon from 'part:@sanity/base/circle-check-icon'
import styles from './styles/ConfirmDialog.css'
import Button from 'part:@sanity/components/buttons/default'
import Portal from 'react-portal'
import LayerStack from 'part:@sanity/components/layer-stack'

export default class DefaultDialog extends React.PureComponent {
  static propTypes = {
    color: PropTypes.oneOf(['warning', 'success', 'danger', 'info']),
    confirmColor: PropTypes.oneOf(['success', 'danger']),
    className: PropTypes.string,
    children: PropTypes.node,
    onClose: PropTypes.func,
    onConfirm: PropTypes.func,
    onCancel: PropTypes.func,
    confirmButtonText: PropTypes.string,
    cancelButtonText: PropTypes.string
  }

  static defaultProps = {
    isOpen: false,
    showHeader: false,
    onAction() {},
    onOpen() {},
    actions: [],
    kind: 'default',
    confirmColor: 'success',
    confirmButtonText: 'OK',
    cancelButtonText: 'Cancel'
  }

  state = {
    hasFocus: true
  }

  componentWillMount() {
    LayerStack.addLayer(this)
  }

  componentDidMount() {
    window.addEventListener('keydown', this.handleKeyDown, false)
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.handleKeyDown, false)
    LayerStack.removeLayer(this)
  }

  isClosable() {
    return typeof this.props.onClose === 'function'
  }

  handleKeyDown = event => {
    if (event.key === 'Escape') {
      this.handleCancel(event)
    }
  }

  handleDialogClick = event => {
    event.stopPropagation()
  }

  setDialogElement = element => {
    this.dialog = element
  }

  handleConfirm = event => {
    this.props.onConfirm(event)
    this.handleClose()
  }

  handleCancel = event => {
    this.props.onCancel(event)
    this.handleClose()
  }

  handleClose = () => {
    if (!this.state.isFocused) {
      return
    }
    this.props.onClose()
  }

  render() {
    const {
      color,
      className,
      confirmColor,
      confirmButtonText,
      cancelButtonText,
      onCancel
    } = this.props

    return (
      <Portal isOpened>
        <div
          className={`${styles.root} ${styles[color]} ${className}`}
          ref={this.setDialogElement}
          onClick={onCancel}
        >
          <div className={styles.dialog} onClick={this.handleDialogClick}>
            <div className={styles.inner}>
              <div className={styles.content}>
                {this.props.children}
              </div>

              <div className={styles.footer}>
                <Button
                  onClick={this.handleCancel}
                  icon={CloseIcon}
                  kind="secondary"
                >
                  {cancelButtonText}
                </Button>
                <Button
                  onClick={this.handleConfirm}
                  color={confirmColor}
                  icon={CheckIcon}
                  autoFocus
                >
                  {confirmButtonText}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Portal>
    )
  }
}
