/* eslint-disable react/no-unused-prop-types */

import classNames from 'classnames'
import {partition} from 'lodash'
import CloseIcon from 'part:@sanity/base/close-icon'
import styles from 'part:@sanity/components/dialogs/popover-style'
import Button from 'part:@sanity/components/buttons/default'
import ButtonGrid from 'part:@sanity/components/buttons/button-grid'
import {useLayer} from 'part:@sanity/components/layer'
import {Popover} from 'part:@sanity/components/popover'
import React, {useCallback, useEffect, useState} from 'react'
import {useClickOutside} from '../hooks'
import {Placement} from '../types'
import {DialogAction} from './types'

interface PopoverDialogChildrenProps {
  actions?: DialogAction[]
  children: React.ReactNode
  onAction?: (action: DialogAction) => void
  onClickOutside?: () => void
  onClose?: () => void
  onEscape?: (event: KeyboardEvent) => void
  title?: string
}

interface PopoverDialogProps extends PopoverDialogChildrenProps {
  boundaryElement?: HTMLElement | null
  color?: 'default' | 'danger'
  fallbackPlacements?: Placement[]
  hasAnimation?: boolean
  padding?: 'none' | 'small' | 'medium' | 'large'
  placement?: Placement
  referenceElement?: HTMLElement | null
  size?: 'small' | 'medium' | 'large' | 'auto'
  useOverlay?: boolean

  // deprecated
  portal?: boolean
}

function PopoverDialog(props: PopoverDialogProps) {
  const {
    boundaryElement,
    children,
    color,
    fallbackPlacements,
    hasAnimation,
    padding = 'medium',
    placement = 'auto',
    referenceElement: referenceElementProp,
    size = 'medium',
    useOverlay = false,
    ...restProps
  } = props

  const [targetElement, setTargetElement] = useState<HTMLDivElement | null>(null)
  const referenceElement = referenceElementProp || targetElement

  return (
    <>
      {!referenceElementProp && <div ref={setTargetElement} />}

      {useOverlay && <div className={styles.overlay} />}

      {referenceElement && (
        <Popover
          arrowClassName={classNames(styles.arrow, hasAnimation && styles.popperAnimation)}
          boundaryElement={boundaryElement}
          cardClassName={classNames(styles.card, hasAnimation && styles.popperAnimation)}
          className={styles.root}
          content={<PopoverDialogChildren {...restProps}>{children}</PopoverDialogChildren>}
          data-color={color}
          data-padding={padding}
          data-size={size}
          fallbackPlacements={fallbackPlacements}
          layer
          open
          placement={placement}
          portal
          targetElement={referenceElement}
        />
      )}
    </>
  )
}

export default PopoverDialog

function PopoverDialogChildren(props: PopoverDialogChildrenProps) {
  const {actions = [], children, onAction, onClickOutside, onClose, onEscape, title} = props

  const layer = useLayer()

  const [primary, secondary] = partition(actions, (action) => action.primary)

  const secondaryActionButtons = secondary.map((action, actionIndex) => (
    // eslint-disable-next-line react/no-array-index-key
    <PopoverDialogActionButton action={action} key={actionIndex} onAction={onAction} />
  ))

  const primaryActionButtons = primary.map((action, actionIndex) => (
    // eslint-disable-next-line react/no-array-index-key
    <PopoverDialogActionButton action={action} key={actionIndex} onAction={onAction} />
  ))

  const isTopLayer = layer.depth === layer.size

  useEffect(() => {
    if (!isTopLayer) return undefined

    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        if (onEscape) onEscape(event)
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown)

    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown)
    }
  }, [isTopLayer, onEscape])

  const [rootElement, setRootElement] = useState<HTMLDivElement | null>(null)

  useClickOutside(
    useCallback(() => {
      if (isTopLayer) {
        if (onClickOutside) onClickOutside()
      }
    }, [isTopLayer, onClickOutside]),
    [rootElement]
  )

  return (
    <div className={styles.root} ref={setRootElement}>
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
          <Button icon={CloseIcon} kind="simple" onClick={onClose} padding="small" title="Close" />
        </div>
      )}

      <div className={styles.content}>
        <div className={styles.contentWrapper}>{children}</div>
      </div>

      {actions.length > 0 && (
        <div className={styles.footer}>
          <ButtonGrid align="end" secondary={primaryActionButtons}>
            {secondaryActionButtons}
          </ButtonGrid>
        </div>
      )}
    </div>
  )
}

function PopoverDialogActionButton({
  action,
  onAction,
}: {
  action: DialogAction
  onAction?: (a: DialogAction) => void
}) {
  const handleAction = useCallback(() => {
    if (onAction) onAction(action)
  }, [action, onAction])

  return (
    <Button
      onClick={handleAction}
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
