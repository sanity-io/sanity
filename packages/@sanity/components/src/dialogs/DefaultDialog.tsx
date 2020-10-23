/* eslint-disable react/no-unused-prop-types */

import classNames from 'classnames'
import CloseIcon from 'part:@sanity/base/close-icon'
import Button from 'part:@sanity/components/buttons/default'
import {ContainerQuery} from 'part:@sanity/components/container-query'
import styles from 'part:@sanity/components/dialogs/default-style'
import {Layer, useLayer} from 'part:@sanity/components/layer'
import {ScrollContainer} from 'part:@sanity/components/scroll'
import React, {createElement, useCallback, useEffect, useState} from 'react'
import {useClickOutside} from '../hooks'
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
  return <Layer>{createElement(DefaultDialogChildren, props)}</Layer>
}

export default DefaultDialog

function DefaultDialogChildren(props: DefaultDialogProps) {
  const {
    actions,
    actionsAlign,
    children,
    className: classNameProp,
    color,
    onAction,
    onClose,
    onClickOutside,
    onEscape,
    padding = 'medium',
    showCloseButton = true,
    size = 'medium',
    title,
  } = props

  const layer = useLayer()
  const isTopLayer = layer.depth === layer.size
  const [cardElement, setCardElement] = useState<HTMLDivElement | null>(null)
  const renderCloseButton = onClose && showCloseButton
  const renderFloatingCloseButton = !title && renderCloseButton
  const contentClassName =
    actions && actions.length > 0 ? styles.content : styles.contentWithoutFooter

  useClickOutside(
    useCallback(() => {
      if (isTopLayer) {
        if (onClickOutside) onClickOutside()
      }
    }, [isTopLayer, onClickOutside]),
    [cardElement]
  )

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

  const hasActions = actions && actions.length > 0

  return (
    <ContainerQuery
      className={classNames(styles.root, hasActions && styles.hasFunctions, classNameProp)}
      data-dialog-color={color}
      data-dialog-padding={padding}
      data-dialog-size={size}
    >
      <div className={styles.overlay} />

      <div className={styles.card} ref={setCardElement}>
        <div className={styles.inner}>
          {renderFloatingCloseButton && (
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
            </div>
          )}

          <ScrollContainer className={contentClassName}>
            <div className={styles.contentWrapper}>{children}</div>
          </ScrollContainer>

          {actions && actions.length > 0 && (
            <div className={styles.footer}>
              <DefaultDialogActions
                actions={actions}
                actionsAlign={actionsAlign}
                onAction={onAction}
              />
            </div>
          )}
        </div>
      </div>
    </ContainerQuery>
  )
}
