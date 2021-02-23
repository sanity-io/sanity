/* eslint-disable react/no-unused-prop-types */

import {Portal, useLayer} from '@sanity/ui'
import classNames from 'classnames'
import {partition} from 'lodash'
import CloseIcon from 'part:@sanity/base/close-icon'
import Button from 'part:@sanity/components/buttons/default'
import ButtonGrid from 'part:@sanity/components/buttons/button-grid'
import styles from 'part:@sanity/components/dialogs/fullscreen-style'
import React, {useCallback, useEffect, useState} from 'react'
import {LegacyLayerProvider, ScrollContainer} from '../../../../components'
import {useClickOutside} from '../hooks'
import {DialogAction} from './types'

interface FullScreenDialogProps {
  cardClassName?: string
  className?: string
  title?: React.ReactNode
  children?: React.ReactNode
  onClickOutside?: () => void
  onClose?: () => void
  onEscape?: (event: KeyboardEvent) => void
  isOpen?: boolean
  onAction?: (action: DialogAction) => void
  actions?: DialogAction[]

  // deprecated
  color?: 'default' | 'warning' | 'info' | 'success' | 'danger'
  padding?: 'none' | 'small' | 'medium' | 'large'
}

function FullscreenDialog(props: FullScreenDialogProps) {
  return (
    <Portal>
      <LegacyLayerProvider zOffset="portal">
        <FullscreenDialogChildren {...props} />
      </LegacyLayerProvider>
    </Portal>
  )
}

export default FullscreenDialog

function FullscreenDialogChildren(props: FullScreenDialogProps) {
  const {
    children,
    color,
    title,
    cardClassName,
    className,
    isOpen = true,
    onAction,
    onClickOutside,
    onClose,
    onEscape,
    padding,
    actions,
    ...restProps
  } = props
  const {isTopLayer, zIndex} = useLayer()
  const [secondary, primary] = partition(actions, (action) => action.secondary)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.shiftKey || isTopLayer) && event.key === 'Escape') {
        if (onEscape) onEscape(event)
        // NOTE: This code used to be `onEscape || onClose`
        else if (onClose) onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isTopLayer, onClose, onEscape])

  const [cardElement, setCardElement] = useState<HTMLDivElement | null>(null)

  useClickOutside(
    useCallback(() => {
      if (!isTopLayer) return
      if (onClickOutside) onClickOutside()
    }, [isTopLayer, onClickOutside]),
    [cardElement]
  )

  return (
    <div
      {...restProps}
      className={classNames(styles.root, isOpen ? styles.isOpen : styles.isClosed, className)}
      style={{zIndex}}
    >
      <div className={classNames(styles.card, cardClassName)} ref={setCardElement}>
        {(title || onClose) && (
          <header className={styles.header}>
            {title && <h1 className={styles.title}>{title}</h1>}

            {onClose && (
              <div className={styles.actions}>
                <Button
                  className={styles.closeButton}
                  icon={CloseIcon}
                  kind="simple"
                  onClick={onClose}
                  padding="small"
                />
              </div>
            )}
          </header>
        )}

        {children && <ScrollContainer className={styles.content}>{children}</ScrollContainer>}

        {actions && actions.length > 0 && (
          <div className={styles.actionsWrapper}>
            <ButtonGrid
              align="end"
              secondary={secondary.map((action, actionIndex) => (
                <FullscreenDialogActionButton
                  action={action}
                  index={actionIndex}
                  // eslint-disable-next-line react/no-array-index-key
                  key={actionIndex}
                  onAction={onAction}
                />
              ))}
            >
              {primary.map((action, actionIndex) => (
                <FullscreenDialogActionButton
                  action={action}
                  index={actionIndex}
                  // eslint-disable-next-line react/no-array-index-key
                  key={actionIndex}
                  onAction={onAction}
                />
              ))}
            </ButtonGrid>
          </div>
        )}
      </div>
    </div>
  )
}

function FullscreenDialogActionButton(props: {
  action: DialogAction
  index: number
  onAction?: (action: DialogAction) => void
}) {
  const {action, index, onAction} = props
  const handleClick = useCallback(() => onAction && onAction(action), [action, onAction])

  return (
    <Button
      autoFocus={action.autoFocus}
      className={action.secondary ? styles.actionSecondary : undefined}
      color={action.color}
      data-action-index={index}
      disabled={action.disabled}
      inverted={action.inverted}
      kind={action.kind}
      onClick={handleClick}
    >
      {action.title}
    </Button>
  )
}
