/* eslint-disable complexity */
import PropTypes from 'prop-types'
import React from 'react'
import CloseIcon from 'part:@sanity/base/close-icon'
import styles from 'part:@sanity/components/dialogs/default-style'
import Button from 'part:@sanity/components/buttons/default'
import ButtonCollection from 'part:@sanity/components/buttons/collection'
import {Portal} from '../utilities/Portal'
import Escapable from '../utilities/Escapable'
import CaptureOutsideClicks from '../utilities/CaptureOutsideClicks'
import Stacked from '../utilities/Stacked'

export default class DefaultDialog extends React.Component {
  static propTypes = {
    color: PropTypes.oneOf(['default', 'warning', 'success', 'danger', 'info']),
    className: PropTypes.string,
    title: PropTypes.string,
    children: PropTypes.node,
    onOpen: PropTypes.func,
    onClose: PropTypes.func.isRequired,
    onAction: PropTypes.func,
    showHeader: PropTypes.bool,
    showCloseButton: PropTypes.bool,
    actions: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string.isRequired,
        tooltip: PropTypes.string,
        kind: PropTypes.string,
        autoFocus: PropTypes.bool
      })
    )
  }

  static defaultProps = {
    showHeader: false,
    showCloseButton: true,
    onAction() {},
    onOpen() {},
    actions: [],
    color: 'default'
  }

  openDialogElement() {
    this.props.onOpen()
  }

  handleDialogClick = event => {
    event.stopPropagation()
  }

  setDialogElement = element => {
    this.dialog = element
  }

  createButtonFromAction = (action, i) => {
    return (
      <Button
        key={i}
        onClick={() => this.props.onAction(action)}
        data-action-index={i}
        color={action.color}
        disabled={action.disabled}
        kind={action.kind}
        autoFocus={action.autoFocus}
        className={action.secondary ? styles.actionSecondary : ''}
      >
        {action.title}
      </Button>
    )
  }

  renderActions = actions => {
    if (!actions || actions.length < 1) {
      return undefined
    }

    const primaryButtons = actions
      .map((action, i) => {
        if (!action.secondary) {
          return this.createButtonFromAction(action, i)
        }
        return false
      })
      .filter(Boolean)

    const secondaryButtons = actions
      .map((action, i) => {
        if (action.secondary) {
          return this.createButtonFromAction(action, i)
        }
        return false
      })
      .filter(Boolean)

    return (
      <ButtonCollection align="end" secondary={secondaryButtons}>
        {primaryButtons}
      </ButtonCollection>
    )
  }

  render() {
    const {title, actions, showHeader, color, onClose, className, showCloseButton} = this.props
    const classNames = `
      ${styles[color]}
      ${styles.isOpen}
      ${showHeader ? styles.hasHeader : ''}
      ${actions && actions.length > 0 ? styles.hasFunctions : ''}
      ${className}
    `

    return (
      <Portal>
        <Stacked>
          {isActive => (
            <div className={classNames}>
              <div className={styles.dialog}>
                <Escapable onEscape={event => (isActive || event.shiftKey) && onClose()} />
                <CaptureOutsideClicks onClickOutside={isActive ? onClose : undefined}>
                  <div className={styles.inner}>
                    {!showHeader &&
                      onClose &&
                      showCloseButton && (
                        <button
                          className={styles.closeButtonOutside}
                          onClick={onClose}
                          type="button"
                        >
                          <CloseIcon color="inherit" />
                        </button>
                      )}
                    {showHeader &&
                      onClose &&
                      title && (
                        <div className={styles.header}>
                          <h1 className={styles.title}>{title}</h1>
                          <button className={styles.closeButton} onClick={onClose} type="button">
                            <CloseIcon color="inherit" />
                          </button>
                        </div>
                      )}
                    <div className={styles.content}>{this.props.children}</div>
                    {actions &&
                      actions.length > 0 && (
                        <div className={styles.footer}>{this.renderActions(actions)}</div>
                      )}
                  </div>
                </CaptureOutsideClicks>
              </div>
            </div>
          )}
        </Stacked>
      </Portal>
    )
  }
}
