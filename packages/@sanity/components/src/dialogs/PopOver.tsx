import classNames from 'classnames'
import {partition} from 'lodash'
import CloseIcon from 'part:@sanity/base/close-icon'
import styles from 'part:@sanity/components/dialogs/popover-style'
import Button from 'part:@sanity/components/buttons/default'
import ButtonGrid from 'part:@sanity/components/buttons/button-grid'
import {ClickOutside} from 'part:@sanity/components/click-outside'
import {Popover} from 'part:@sanity/components/popover'
import React, {useCallback, useState} from 'react'
import {Portal} from '../utilities/Portal'
import Stacked from '../utilities/Stacked'
import Escapable from '../utilities/Escapable'
import {Placement} from '../types'
import {DialogAction} from './types'

interface PopOverProps {
  title?: string
  children: React.ReactNode
  onClose?: () => void
  onClickOutside?: () => void
  onEscape?: (event: KeyboardEvent) => void
  onAction?: (action: DialogAction) => void
  placement?: Placement
  useOverlay?: boolean
  hasAnimation?: boolean
  color?: 'default' | 'danger'
  padding?: 'none' | 'small' | 'medium' | 'large'
  referenceElement?: HTMLElement | null
  actions?: DialogAction[]
  size?: 'small' | 'medium' | 'large' | 'auto'
}

function PopoverDialogActionButton({
  action,
  onAction
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

export default function PopOver(props: PopOverProps) {
  const {
    title,
    color,
    children,
    actions,
    onAction,
    onClose,
    onClickOutside,
    onEscape,
    padding = 'medium',
    placement = 'auto',
    size = 'medium',
    useOverlay = false,
    hasAnimation,
    referenceElement: referenceElementProp
  } = props

  const [targetElement, setTargetElement] = useState<HTMLDivElement | null>(null)
  const referenceElement = referenceElementProp || targetElement

  const handleEscape = useCallback(
    (event: KeyboardEvent) => {
      if (event.shiftKey && onEscape) onEscape(event)
    },
    [onEscape]
  )

  const [primary, secondary] = partition(actions, action => action.primary)

  const secondaryActionButtons = secondary.map((action, actionIndex) => (
    // eslint-disable-next-line react/no-array-index-key
    <PopoverDialogActionButton action={action} key={actionIndex} onAction={onAction} />
  ))

  const primaryActionButtons = primary.map((action, actionIndex) => (
    // eslint-disable-next-line react/no-array-index-key
    <PopoverDialogActionButton action={action} key={actionIndex} onAction={onAction} />
  ))

  return (
    <>
      {!referenceElementProp && <div ref={setTargetElement} />}

      <Portal>
        <Stacked>
          {isActive => (
            <>
              {useOverlay && <div className={styles.overlay} />}

              {referenceElement && (
                <ClickOutside onClickOutside={isActive ? onClickOutside : undefined}>
                  {ref => (
                    <Popover
                      arrowClassName={classNames(
                        styles.arrow,
                        hasAnimation && styles.popperAnimation
                      )}
                      cardClassName={classNames(
                        styles.card,
                        hasAnimation && styles.popperAnimation
                      )}
                      className={styles.root}
                      data-color={color}
                      data-padding={padding}
                      data-size={size}
                      content={
                        <>
                          <Escapable onEscape={isActive ? handleEscape : undefined} />

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

                          <div className={styles.content}>
                            <div className={styles.contentWrapper}>{children}</div>
                          </div>

                          {actions && actions.length > 0 && (
                            <div className={styles.footer}>
                              <ButtonGrid align="end" secondary={primaryActionButtons}>
                                {secondaryActionButtons}
                              </ButtonGrid>
                            </div>
                          )}
                        </>
                      }
                      placement={placement}
                      open
                      ref={ref}
                      targetElement={referenceElement}
                    />
                  )}
                </ClickOutside>
              )}
            </>
          )}
        </Stacked>
      </Portal>
    </>
  )
}
