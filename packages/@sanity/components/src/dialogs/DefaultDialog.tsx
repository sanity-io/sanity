/* eslint-disable complexity */

import classNames from 'classnames'
import React from 'react'
import CloseIcon from 'part:@sanity/base/close-icon'
import {ContainerQuery} from 'part:@sanity/components/container-query'
import styles from 'part:@sanity/components/dialogs/default-style'
import Button from 'part:@sanity/components/buttons/default'
import ButtonGrid from 'part:@sanity/components/buttons/button-grid'
import {Portal} from 'part:@sanity/components/portal'
import {partition} from 'lodash'
import Escapable from '../utilities/Escapable'
import CaptureOutsideClicks from '../utilities/CaptureOutsideClicks'
import Stacked from '../utilities/Stacked'
import {DialogAction, DialogColor} from './types'

interface DefaultDialogProps {
  actions?: DialogAction[]
  actionsAlign?: 'start' | 'end'
  children?: React.ReactNode
  color?: DialogColor
  className?: string
  onOpen?: () => void
  onClose?: () => void
  onEscape?: (event: KeyboardEvent) => void
  onClickOutside?: () => void
  onAction?: (action: DialogAction) => void
  padding?: 'none' | 'small' | 'medium' | 'large'
  showCloseButton?: boolean
  size?: 'small' | 'medium' | 'large' | 'auto'
  title?: string
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
      actions,
      className: classNameProp,
      color = 'default',
      onClose,
      onClickOutside,
      onEscape,
      padding = 'medium',
      showCloseButton = true,
      size = 'medium',
      title
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
            <ContainerQuery
              className={className}
              data-dialog-padding={padding}
              data-dialog-size={size}
            >
              <div className={styles.overlay} />
              <div className={styles.card}>
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
            </ContainerQuery>
          )}
        </Stacked>
      </Portal>
    )
  }
}
