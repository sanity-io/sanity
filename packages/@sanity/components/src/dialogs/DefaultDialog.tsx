/* eslint-disable complexity */

import classNames from 'classnames'
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
import {DialogAction} from './types'

interface DefaultDialogProps {
  color?: 'default' | 'warning' | 'success' | 'danger' | 'info'
  className?: string
  title?: string
  children?: React.ReactNode
  onOpen?: () => void
  onClose?: () => void
  onEscape?: (event: KeyboardEvent) => void
  onClickOutside?: () => void
  onAction?: (action: DialogAction) => void
  showCloseButton?: boolean
  actionsAlign?: 'start' | 'end'
  actions?: DialogAction[]
}

const noop = () => undefined

export default class DefaultDialog extends React.PureComponent<DefaultDialogProps> {
  contentElement: unknown
  dialog: unknown

  openDialogElement() {
    if (this.props.onOpen) this.props.onOpen()
  }

  setDialogElement = (element: unknown) => {
    this.dialog = element
  }

  setContentElement = (element: unknown) => {
    this.contentElement = element
  }

  createButtonFromAction = (action: DialogAction, i: number) => {
    return (
      <Button
        key={i}
        onClick={() => this.props.onAction && this.props.onAction(action)}
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

  renderActions = (actions: DialogAction[]) => {
    if (!actions || actions.length === 0) {
      return null
    }

    const [secondary, primary] = partition(actions, action => action.secondary)
    const {actionsAlign = 'end'} = this.props

    return (
      <ButtonGrid align={actionsAlign} secondary={secondary.map(this.createButtonFromAction)}>
        {primary.map(this.createButtonFromAction)}
      </ButtonGrid>
    )
  }

  render() {
    const {
      title,
      actions,
      color = 'default',
      onClose,
      onClickOutside,
      onEscape,
      className: classNameProp,
      showCloseButton = true
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
          {isActive => (
            <div className={className}>
              <div className={styles.overlay} />
              <div className={styles.dialog}>
                <Escapable
                  onEscape={event => (isActive || event.shiftKey) && handleEscape(event as any)}
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
