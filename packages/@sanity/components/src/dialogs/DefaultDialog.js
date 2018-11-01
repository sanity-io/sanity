/* eslint-disable complexity */
import PropTypes from 'prop-types'
import React from 'react'
import CloseIcon from 'part:@sanity/base/close-icon'
import styles from 'part:@sanity/components/dialogs/default-style'
import Button from 'part:@sanity/components/buttons/default'
import ButtonCollection from 'part:@sanity/components/buttons/button-collection'
import {partition} from 'lodash'
import Ink from 'react-ink'
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
    if (!actions || actions.length === 0) {
      return null
    }

    const [secondary, primary] = partition(actions, action => action.secondary)

    return (
      <ButtonCollection align="end" secondary={secondary.map(this.createButtonFromAction)}>
        {primary.map(this.createButtonFromAction)}
      </ButtonCollection>
    )
  }

  render() {
    const {title, actions, color, onClose, className, showCloseButton} = this.props
    const classNames = `
      ${styles.root}
      ${styles[color]}
      ${actions && actions.length > 0 ? styles.hasFunctions : ''}
      ${className}
    `

    return (
      <Portal>
        <Stacked>
          {isActive => (
            <div className={classNames}>
              <div className={styles.overlay} />
              <div className={styles.dialog}>
                <Escapable onEscape={event => (isActive || event.shiftKey) && onClose()} />
                <CaptureOutsideClicks onClickOutside={isActive ? onClose : undefined} className={styles.inner}>
                  {!title &&
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
                  {title && (
                    <div className={styles.header}>
                      <h1 className={styles.title}>{title}</h1>
                      {onClose && (
                        <button
                          className={styles.closeButton}
                          onClick={onClose}
                          type="button"
                          title="Close"
                        >
                          <div className={styles.closeButtonIcon}>
                            <CloseIcon color="inherit" />
                          </div>
                          <Ink duration={1000} opacity={0.1} radius={200} />
                        </button>
                      )}
                    </div>
                  )}
                  <div
                    className={
                      actions && actions.length > 0 ? styles.content : styles.contentWithoutFooter
                    }
                  >
                    {this.props.children}
                  </div>
                  {actions &&
                    actions.length > 0 && (
                      <div className={styles.footer}>{this.renderActions(actions)}</div>
                    )}
                </CaptureOutsideClicks>
              </div>
            </div>
          )}
        </Stacked>
      </Portal>
    )
  }
}
