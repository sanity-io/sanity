/* eslint-disable react/no-unused-prop-types */

import {Layer, Portal, useClickOutside, useLayer} from '@sanity/ui'
import classNames from 'classnames'
import CloseIcon from 'part:@sanity/base/close-icon'
import Button from 'part:@sanity/components/buttons/default'
import {ContainerQuery} from 'part:@sanity/components/container-query'
import styles from 'part:@sanity/components/dialogs/default-style'
import {ScrollContainer} from 'part:@sanity/components/scroll'
import React, {createElement, useCallback, useEffect, useState} from 'react'
import {DefaultDialogActions} from './DefaultDialogActions'
import {DialogAction, DialogColor} from './types'

interface DefaultDialogProps {
  actions?: DialogAction[]
  actionsAlign?: 'start' | 'end'
  children?: React.ReactNode
  color?: DialogColor
  className?: string
  onClose?: () => void
  onEscape?: (event: KeyboardEvent) => void
  onClickOutside?: () => void
  onAction?: (action: DialogAction) => void
  padding?: 'none' | 'small' | 'medium' | 'large'
  showCloseButton?: boolean
  size?: 'small' | 'medium' | 'large' | 'auto'
  title?: string
}

function DefaultDialog(props: DefaultDialogProps) {
  const {actions, className: classNameProp, color, padding = 'medium', size = 'medium'} = props
  const hasActions = actions && actions.length > 0

  return (
    <Portal>
      <Layer
        className={classNames(styles.root, hasActions && styles.hasFunctions, classNameProp)}
        data-dialog-color={color}
        data-dialog-padding={padding}
        data-dialog-size={size}
      >
        {createElement(DefaultDialogChildren, props)}
      </Layer>
    </Portal>
  )
}

export default DefaultDialog

function DefaultDialogChildren(props: DefaultDialogProps) {
  const {
    actions,
    actionsAlign,
    children,
    color,
    onAction,
    onClose,
    onClickOutside,
    onEscape,
    showCloseButton = true,
    title,
  } = props

  const {isTopLayer} = useLayer()
  const [cardElement, setCardElement] = useState<HTMLDivElement | null>(null)
  const renderCloseButton = onClose && showCloseButton
  const renderFloatingCloseButton = !title && renderCloseButton
  const contentClassName =
    actions && actions.length > 0 ? styles.content : styles.contentWithoutFooter

  const handleClickOutside = useCallback(() => {
    if (isTopLayer) {
      if (onClickOutside) onClickOutside()
    }
  }, [isTopLayer, onClickOutside])

  useClickOutside(handleClickOutside, [cardElement])

  const closeButtonColor =
    color && ['danger', 'success', 'warning'].includes(color) ? 'white' : undefined

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.shiftKey || isTopLayer) && event.key === 'Escape') {
        event.stopPropagation()
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

  return (
    <ContainerQuery className={styles.containerQuery}>
      <div className={styles.overlay} />

      <Layer className={styles.card} ref={setCardElement}>
        <div className={styles.inner}>
          {renderFloatingCloseButton && (
            <Layer className={styles.floatingCloseButtonContainer}>
              <Button
                icon={CloseIcon}
                kind="simple"
                onClick={onClose}
                padding="small"
                title="Close"
              />
            </Layer>
          )}

          {title && (
            <Layer className={styles.header}>
              <div className={styles.title}>
                <h1>{title}</h1>
              </div>

              {renderCloseButton && (
                <div className={styles.closeButtonContainer}>
                  <Button
                    className={styles.closeButton}
                    color={closeButtonColor}
                    icon={CloseIcon}
                    kind="simple"
                    onClick={onClose}
                    padding="small"
                    title="Close"
                  />
                </div>
              )}
            </Layer>
          )}

          <ScrollContainer className={contentClassName}>
            <div className={styles.contentWrapper}>{children}</div>
          </ScrollContainer>

          {actions && actions.length > 0 && (
            <Layer className={styles.footer}>
              <DefaultDialogActions
                actions={actions}
                actionsAlign={actionsAlign}
                onAction={onAction}
              />
            </Layer>
          )}
        </div>
      </Layer>
    </ContainerQuery>
  )
}
