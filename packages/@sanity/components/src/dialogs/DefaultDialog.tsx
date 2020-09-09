import classNames from 'classnames'
import PropTypes from 'prop-types'
import React from 'react'
import CloseIcon from 'part:@sanity/base/close-icon'
import styles from 'part:@sanity/components/dialogs/default-style'
import Button from 'part:@sanity/components/buttons/default'
import ButtonGrid from 'part:@sanity/components/buttons/button-grid'
import {Portal} from 'part:@sanity/components/portal'
import {partition} from 'lodash'
import Escapable from '../utilities/Escapable'
import CaptureOutsideClicks from '../utilities/CaptureOutsideClicks'
import Stacked from '../utilities/Stacked'

const noop = () => {}

export default class DefaultDialog extends React.PureComponent {
  static propTypes = {
    color: PropTypes.oneOf(['default', 'warning', 'success', 'danger', 'info']),
    className: PropTypes.string,
    title: PropTypes.string,
    children: PropTypes.node,
    onOpen: PropTypes.func,
    onClose: PropTypes.func,
    onEscape: PropTypes.func,
    onClickOutside: PropTypes.func,
    onAction: PropTypes.func,
    showCloseButton: PropTypes.bool,
    actionsAlign: PropTypes.oneOf(['start', 'end']),
    actions: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string.isRequired,
        icon: PropTypes.func,
        tooltip: PropTypes.string,
        kind: PropTypes.string,
        autoFocus: PropTypes.bool
      })
    )
  }

  static defaultProps = {
    showCloseButton: true,
    actionsAlign: 'end',
    onAction() {},
    onOpen() {},
    onClose() {},
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

  setContentElement = element => {
    this.contentElement = element
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
        inverted={action.inverted}
        autoFocus={action.autoFocus}
        icon={action.icon}
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
      <ButtonGrid
        align={this.props.actionsAlign}
        secondary={secondary.map(this.createButtonFromAction)}
      >
        {primary.map(this.createButtonFromAction)}
      </ButtonGrid>
    )
  }

  render() {
    const {
      title,
      actions,
      color,
      onClose,
      onClickOutside,
      onEscape,
      className: classNameProp,
      showCloseButton
    } = this.props

    const className = classNames(
      styles.root,
      styles[color],
      actions && actions.length > 0 && styles.hasFunctions,
      classNameProp
    )

    const handleEscape = onEscape || onClose || noop

    return (
      <Portal>
        <Stacked>
          {/* eslint-disable-next-line complexity */}
          {isActive => (
            <div className={className}>
              <div className={styles.overlay} />
              <div className={styles.dialog}>
                <Escapable
                  onEscape={event => (isActive || event.shiftKey) && handleEscape(event)}
                />
                <CaptureOutsideClicks
                  onClickOutside={isActive ? onClickOutside : undefined}
                  className={styles.inner}
                >
                  {!title && onClose && showCloseButton && (
                    <div className={styles.floatingCloseButtonContainer}>
                      <Button
                        icon={CloseIcon}
                        kind="simple"
                        onClick={onClose}
                        padding="small"
                        title="Close"
                      />
                    </div>
                  )}
                  {title && (
                    <div className={styles.header}>
                      <div className={styles.title}>
                        <h1>{title}</h1>
                      </div>
                      {onClose && showCloseButton && (
                        <div className={styles.closeButtonContainer}>
                          <Button
                            className={styles.closeButton}
                            color={
                              ['danger', 'success', 'warning'].includes(color) ? 'white' : undefined
                            }
                            icon={CloseIcon}
                            kind="simple"
                            onClick={onClose}
                            padding="small"
                            title="Close"
                          />
                        </div>
                      )}
                    </div>
                  )}
                  <div
                    ref={this.setContentElement}
                    className={
                      actions && actions.length > 0 ? styles.content : styles.contentWithoutFooter
                    }
                  >
                    {this.props.children}
                  </div>
                  {actions && actions.length > 0 && (
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
