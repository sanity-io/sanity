import {Menu} from '@sanity/ui'
import {memo, type ReactNode, useCallback, useId, useMemo, useState} from 'react'
import {
  ContextMenuButton,
  type DocumentActionDescription,
  LegacyLayerProvider,
  useTranslation,
} from 'sanity'

import {MenuButton, MenuItem, type PopoverProps} from '../../../../ui-components'
import {structureLocaleNamespace} from '../../../i18n'
import {ActionStateDialog} from './ActionStateDialog'

export interface ActionMenuButtonProps {
  actionStates: DocumentActionDescription[]
  disabled: boolean
}

/**
 * @internal
 */
export const ActionDialogWrapper = memo(function ActionDialogWrapper({
  actionStates,
  children,
  referenceElement,
}: {
  actionStates: DocumentActionDescription[]
  children: ({handleAction}: {handleAction: (idx: number) => void}) => ReactNode
  referenceElement?: HTMLElement | null
}) {
  const [actionIndex, setActionIndex] = useState(-1)
  const currentAction = useMemo(() => actionStates[actionIndex], [actionIndex, actionStates])

  const handleAction = useCallback((idx: number) => {
    setActionIndex(idx)
  }, [])

  const result = useMemo(() => children({handleAction}), [children, handleAction])

  return (
    <>
      {currentAction && currentAction.dialog && (
        <LegacyLayerProvider zOffset="paneFooter">
          <ActionStateDialog dialog={currentAction.dialog} referenceElement={referenceElement} />
        </LegacyLayerProvider>
      )}
      {result}
    </>
  )
})

/**
 * @internal
 */
export function ActionMenuButton(props: ActionMenuButtonProps) {
  const {actionStates, disabled} = props
  const idPrefix = useId()

  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null)

  const popoverProps: PopoverProps = useMemo(
    () => ({
      placement: 'top-end',
      portal: true,
      preventOverflow: true,
    }),
    [],
  )

  const {t} = useTranslation(structureLocaleNamespace)
  const renderActionDialog = useCallback<
    ({handleAction}: {handleAction: (idx: number) => void}) => ReactNode
  >(
    ({handleAction}) => (
      <MenuButton
        id={`${idPrefix}-action-menu`}
        button={
          <ContextMenuButton
            aria-label={t('buttons.action-menu-button.aria-label')}
            disabled={disabled}
            data-testid="action-menu-button"
            tooltipProps={{content: t('buttons.action-menu-button.tooltip')}}
          />
        }
        menu={
          <Menu padding={1}>
            {actionStates.map((actionState, idx) => (
              <ActionMenuListItem
                actionState={actionState}
                disabled={disabled}
                index={idx}
                // eslint-disable-next-line react/no-array-index-key
                key={idx}
                onAction={handleAction}
              />
            ))}
          </Menu>
        }
        popover={popoverProps}
        ref={setReferenceElement}
      />
    ),
    [actionStates, disabled, idPrefix, popoverProps, t],
  )

  return (
    <ActionDialogWrapper actionStates={actionStates} referenceElement={referenceElement}>
      {renderActionDialog}
    </ActionDialogWrapper>
  )
}

interface ActionMenuListItemProps {
  actionState: DocumentActionDescription
  disabled: boolean
  index: number
  onAction: (idx: number) => void
}

export function ActionMenuListItem(props: ActionMenuListItemProps) {
  const {actionState, disabled, index, onAction} = props
  const {onHandle} = actionState

  const handleClick = useCallback(() => {
    onAction(index)
    if (onHandle) onHandle()
  }, [index, onAction, onHandle])

  const hotkeys = useMemo(() => {
    return actionState.shortcut
      ? String(actionState.shortcut)
          .split('+')
          .map((s) => s.slice(0, 1).toUpperCase() + s.slice(1))
      : undefined
  }, [actionState.shortcut])

  return (
    <MenuItem
      data-testid={`action-${actionState.label.replace(' ', '')}`}
      disabled={disabled || Boolean(actionState.disabled)}
      hotkeys={hotkeys}
      icon={actionState.icon}
      onClick={handleClick}
      text={actionState.label}
      tone={actionState.tone}
      {...(actionState.disabled && {tooltipProps: {content: actionState.title}})}
    />
  )
}
