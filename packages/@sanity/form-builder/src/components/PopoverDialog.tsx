import {Layer, Popover, useClickOutside, useLayer} from '@sanity/ui'
import {partition} from 'lodash'
import CloseIcon from 'part:@sanity/base/close-icon'
import styles from 'part:@sanity/components/dialogs/popover-style'
import Button from 'part:@sanity/components/buttons/default'
import ButtonGrid from 'part:@sanity/components/buttons/button-grid'
import {ScrollContainer} from 'part:@sanity/components/scroll'
import React, {useCallback, useEffect, useState} from 'react'
import {Placement, DialogAction} from 'part:@sanity/components/dialogs'

interface PopoverDialogChildrenProps {
  actions?: DialogAction[]
  children: React.ReactNode
  onAction?: (action: DialogAction) => void
  onClickOutside?: () => void
  onClose?: () => void
  onEscape?: (event: KeyboardEvent) => void
  portal?: boolean
  title?: string
}

interface PopoverDialogProps extends PopoverDialogChildrenProps {
  boundaryElement?: HTMLElement | null
  color?: 'default' | 'danger'
  constrainSize?: boolean
  depth?: number
  fallbackPlacements?: Placement[]
  /**
   * @deprecated
   */
  hasAnimation?: boolean
  padding?: 'none' | 'small' | 'medium' | 'large'
  placement?: Placement
  portal?: boolean
  preventOverflow?: boolean
  referenceElement?: HTMLElement | null
  size?: 'small' | 'medium' | 'large' | 'auto'
  /**
   * @deprecated
   */
  useOverlay?: boolean
}

function PopoverDialog(props: PopoverDialogProps) {
  const {
    boundaryElement,
    children,
    constrainSize,
    color,
    depth,
    fallbackPlacements,
    // eslint-disable-next-line
    hasAnimation,
    padding = 'medium',
    placement = 'auto',
    portal = false,
    preventOverflow,
    referenceElement: referenceElementProp,
    size = 'medium',
    // eslint-disable-next-line
    useOverlay,
    ...restProps
  } = props

  const [targetElement, setTargetElement] = useState<HTMLDivElement | null>(null)
  const referenceElement = referenceElementProp || targetElement

  const popover = (
    <Popover
      boundaryElement={boundaryElement}
      className={styles.root}
      constrainSize={constrainSize}
      content={<PopoverDialogChildren {...restProps}>{children}</PopoverDialogChildren>}
      data-color={color}
      data-padding={padding}
      data-size={size}
      fallbackPlacements={fallbackPlacements}
      open
      placement={placement}
      portal={portal}
      preventOverflow={preventOverflow}
      radius={2}
      referenceElement={referenceElement}
      width="auto"
      {...({depth} as any)}
    />
  )

  return (
    <>
      {!referenceElementProp && <div ref={setTargetElement} />}

      {Boolean(referenceElement) && popover}
    </>
  )
}

export default PopoverDialog

function PopoverDialogChildren(props: PopoverDialogChildrenProps) {
  const {actions = [], children, onAction, onClickOutside, onClose, onEscape, title} = props

  const {isTopLayer} = useLayer()

  const [primary, secondary] = partition(actions, (action) => action.primary)

  const secondaryActionButtons = secondary.map((action, actionIndex) => (
    // eslint-disable-next-line react/no-array-index-key
    <PopoverDialogActionButton action={action} key={actionIndex} onAction={onAction} />
  ))

  const primaryActionButtons = primary.map((action, actionIndex) => (
    // eslint-disable-next-line react/no-array-index-key
    <PopoverDialogActionButton action={action} key={actionIndex} onAction={onAction} />
  ))

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

  const handleClickOutside = useCallback(() => {
    if (isTopLayer) {
      if (onClickOutside) onClickOutside()
    }
  }, [isTopLayer, onClickOutside])

  useClickOutside(handleClickOutside, [rootElement])

  return (
    <div className={styles.card} ref={setRootElement}>
      {title && (
        <Layer className={styles.header}>
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
        </Layer>
      )}

      {!title && onClose && (
        <Layer className={styles.floatingCloseButtonContainer}>
          <Button icon={CloseIcon} kind="simple" onClick={onClose} padding="small" title="Close" />
        </Layer>
      )}

      <ScrollContainer className={styles.content}>
        <div className={styles.contentWrapper}>{children}</div>
      </ScrollContainer>

      {actions.length > 0 && (
        <Layer className={styles.footer}>
          <ButtonGrid align="end" secondary={primaryActionButtons}>
            {secondaryActionButtons}
          </ButtonGrid>
        </Layer>
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
