import PropTypes from 'prop-types'
import React from 'react'

import CloseIcon from 'part:@sanity/base/close-icon'
import CheckIcon from 'part:@sanity/base/circle-check-icon'
import styles from './styles/ConfirmDialog.css'
import Button from 'part:@sanity/components/buttons/default'
import {Portal} from '../utilities/Portal'
import StackedEscapable from '../utilities/StackedEscapable'

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

  handleDialogClick = event => {
    event.stopPropagation()
  }

  setDialogElement = element => {
    this.dialog = element
  }
  render() {
    const {
      color,
      className,
      confirmColor,
      confirmButtonText,
      cancelButtonText,
      onConfirm,
      onCancel
    } = this.props

    return (
      <StackedEscapable onEscape={onCancel}>
        <Portal>
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
                    onClick={onCancel}
                    icon={CloseIcon}
                    kind="secondary"
                  >
                    {cancelButtonText}
                  </Button>
                  <Button
                    onClick={onConfirm}
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
      </StackedEscapable>
    )
  }
}
