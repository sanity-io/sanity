import classNames from 'classnames'
import CloseIcon from 'part:@sanity/base/close-icon'
import Button from 'part:@sanity/components/buttons/default'
import {ClickOutside} from 'part:@sanity/components/click-outside'
import {ContainerQuery} from 'part:@sanity/components/container-query'
import styles from 'part:@sanity/components/dialogs/default-style'
import {Portal} from 'part:@sanity/components/portal'
import React, {useCallback, useRef} from 'react'
import Escapable from '../utilities/Escapable'
import Stacked from '../utilities/Stacked'
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
    title
  } = props

  const contentRef = useRef<HTMLDivElement | null>(null)

  const className = classNames(
    styles.root,
    actions && actions.length > 0 && styles.hasFunctions,
    classNameProp
  )

  const handleEscape = useCallback(
    (event: KeyboardEvent) => {
      // This code used to be `onEscape || onClose`
      if (onEscape) onEscape(event)
      else if (onClose) onClose()
    },
    [onEscape, onClose]
  )

  const renderCloseButton = onClose && showCloseButton
  const renderFloatingCloseButton = !title && renderCloseButton
  const contentClassName =
    actions && actions.length > 0 ? styles.content : styles.contentWithoutFooter

  const handleClickOutside = useCallback(() => {
    if (onClickOutside) onClickOutside()
  }, [onClickOutside])

  const closeButtonColor =
    color && ['danger', 'success', 'warning'].includes(color) ? 'white' : undefined

  return (
    <Portal>
      <Stacked>
        {isActive => (
          <ContainerQuery
            className={className}
            data-dialog-color={color}
            data-dialog-padding={padding}
            data-dialog-size={size}
          >
            <div className={styles.overlay} />

            <ClickOutside onClickOutside={isActive ? handleClickOutside : undefined}>
              {ref => (
                <div className={styles.card} ref={ref}>
                  <Escapable
                    // eslint-disable-next-line react/jsx-no-bind
                    onEscape={event => (isActive || event.shiftKey) && handleEscape(event)}
                  />
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

                    <div className={contentClassName} ref={contentRef}>
                      {children}
                    </div>

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
              )}
            </ClickOutside>
          </ContainerQuery>
        )}
      </Stacked>
    </Portal>
  )
}

export default DefaultDialog
