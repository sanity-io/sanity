/* eslint-disable complexity */

import classNames from 'classnames'
import React from 'react'
import styles from 'part:@sanity/components/dialogs/popover-style'
import Button from 'part:@sanity/components/buttons/default'
import ButtonGrid from 'part:@sanity/components/buttons/button-grid'
import CloseIcon from 'part:@sanity/base/close-icon'
import {Manager, Reference, Popper} from 'react-popper'
import {partition} from 'lodash'
import {Portal} from '../utilities/Portal'
import Stacked from '../utilities/Stacked'
import CaptureOutsideClicks from '../utilities/CaptureOutsideClicks'
import Escapable from '../utilities/Escapable'
import {DialogAction} from './types'

interface PopOverProps {
  title?: string
  children: React.ReactNode
  onClose?: () => void
  onClickOutside?: () => void
  onEscape?: (event: KeyboardEvent) => void
  onAction?: (action: DialogAction) => void
  modifiers?: Record<string, any>
  placement?: string
  useOverlay?: boolean
  hasAnimation?: boolean
  color?: 'default' | 'danger'
  padding?: 'none' | 'small' | 'medium' | 'large'
  referenceElement?: Element
  actions?: DialogAction[]
}

// @todo: Rename to `Popover`
export default class PopOver extends React.PureComponent<PopOverProps> {
  static defaultProps = {
    title: undefined,
    onAction: () => undefined,
    actions: [],
    color: 'default',
    padding: 'medium',
    placement: 'auto',
    useOverlay: true,
    hasAnimation: false,
    modifiers: {
      preventOverflow: {
        boundariesElement: 'viewport',
        padding: 16
      }
    }
  }

  createActionButton = (action: DialogAction, i: number) => {
    const {onAction} = this.props

    return (
      <Button
        key={i}
        onClick={() => onAction && onAction(action)}
        data-action-index={i}
        color={action.color}
        disabled={action.disabled}
        kind={action.kind}
        autoFocus={action.autoFocus}
        className={action.secondary ? styles.actionSecondary : ''}
        inverted={action.inverted}
      >
        {action.title}
      </Button>
    )
  }

  render() {
    const {useOverlay, hasAnimation, referenceElement} = this.props
    const {
      title,
      color,
      children,
      actions,
      onClose,
      onClickOutside,
      onEscape,
      modifiers,
      padding
    } = this.props
    const [primary, secondary] = partition(actions, action => action.primary)

    // Undefined referenceElement causes Popper to think it is defined
    const popperPropHack: {referenceElement?: any} = {}
    if (referenceElement) {
      popperPropHack.referenceElement = referenceElement
    }

    return (
      <Manager>
        {!referenceElement && (
          <Reference>{({ref}) => <div ref={ref} className={styles.target} />}</Reference>
        )}
        <Portal>
          <Stacked>
            {isActive => (
              <div>
                {useOverlay && <div className={styles.overlay} />}
                <Popper
                  placement={this.props.placement as any}
                  modifiers={modifiers as any}
                  {...popperPropHack}
                >
                  {({ref, style, placement, arrowProps}) => (
                    <div
                      ref={ref}
                      style={style}
                      data-placement={placement}
                      className={classNames(
                        styles.root,
                        styles[`color_${color}`],
                        styles[`padding_${padding}`]
                      )}
                    >
                      <div className={classNames(hasAnimation && styles.popperAnimation)}>
                        <div
                          className={title ? styles.filledArrow : styles.arrow}
                          ref={arrowProps.ref}
                          style={arrowProps.style}
                        />
                        <div
                          className={styles.arrowShadow}
                          ref={arrowProps.ref}
                          style={arrowProps.style}
                        />
                        <Escapable
                          onEscape={(event: KeyboardEvent) =>
                            (isActive || event.shiftKey) && onEscape && onEscape(event)
                          }
                        />
                        <CaptureOutsideClicks
                          onClickOutside={isActive ? onClickOutside : undefined}
                          className={styles.popover}
                        >
                          {title && (
                            <div className={styles.header}>
                              <div className={styles.title}>
                                <h3>{title}</h3>
                              </div>
                              {onClose && (
                                <div className={styles.closeButtonContainer}>
                                  <Button
                                    className={styles.closeButton}
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
                          {!title && onClose && (
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
                          <div className={styles.content}>{children}</div>
                          {actions && actions.length > 0 && (
                            <div className={styles.footer}>
                              <ButtonGrid
                                align="end"
                                secondary={primary.map(this.createActionButton)}
                              >
                                {secondary.map(this.createActionButton)}
                              </ButtonGrid>
                            </div>
                          )}
                        </CaptureOutsideClicks>
                      </div>
                    </div>
                  )}
                </Popper>
              </div>
            )}
          </Stacked>
        </Portal>
      </Manager>
    )
  }
}
