import {
  InsertMenu as SanityInsertMenu,
  type InsertMenuProps as SanityInsertMenuProps,
} from '@sanity/insert-menu'
import {type SchemaType} from '@sanity/types'
import {useClickOutsideEvent, useGlobalKeyDown} from '@sanity/ui'
import {useCallback, useMemo, useReducer, useRef} from 'react'

import {Popover, type PopoverProps} from '../../../../../ui-components'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'

type PopoverState = {open: boolean}

type PopoverEvent = {type: 'toggle'} | {type: 'close'}

function popoverReducer(state: PopoverState, event: PopoverEvent): PopoverState {
  if (event.type === 'toggle') {
    return {open: !state.open}
  }

  return {
    open: false,
  }
}

/**
 * @internal
 */
export function useInsertMenuPopover(props: {
  insertMenuProps: InsertMenuProps
  popoverProps: Omit<PopoverProps, 'content' | 'open'>
}) {
  const [state, send] = useReducer(popoverReducer, {open: false})
  const popoverRef = useRef<HTMLDivElement | null>(null)
  const referenceElement = props.popoverProps.referenceElement ?? null

  useClickOutsideEvent(
    () => send({type: 'close'}),
    () => [popoverRef.current, referenceElement],
  )

  useGlobalKeyDown(
    useCallback(
      (event: KeyboardEvent) => {
        if (event.key === 'Escape' && state.open) {
          send({type: 'close'})
          referenceElement?.focus()
        }
      },
      [state, referenceElement],
    ),
  )

  const {onSelect, ...insertMenuProps} = props.insertMenuProps
  const handleOnSelect = useCallback(
    (schemaType: SchemaType) => {
      onSelect(schemaType)
      send({type: 'close'})
    },
    [onSelect],
  )
  const popover = useMemo(
    () => (
      <Popover
        ref={popoverRef}
        open={state.open}
        constrainSize
        overflow="hidden"
        portal
        content={<InsertMenu {...insertMenuProps} onSelect={handleOnSelect} />}
        {...props.popoverProps}
      />
    ),
    [handleOnSelect, insertMenuProps, props.popoverProps, state],
  )

  return {
    popover,
    state,
    send,
  }
}

/**
 * @internal
 */
export type InsertMenuProps = Omit<SanityInsertMenuProps, 'labels'>

/**
 * `InsertMenu` with pre-configured `labels`
 */
function InsertMenu(props: InsertMenuProps) {
  const {t} = useTranslation()

  return (
    <SanityInsertMenu
      {...props}
      labels={{
        'insert-menu.filter.all-items': t('inputs.array.insert-menu.filter.all-items'),
        'insert-menu.search.no-results': t('inputs.array.insert-menu.search.no-results'),
        'insert-menu.search.placeholder': t('inputs.array.insert-menu.search.placeholder'),
        'insert-menu.toggle-grid-view.tooltip': t(
          'inputs.array.insert-menu.toggle-grid-view.tooltip',
        ),
        'insert-menu.toggle-list-view.tooltip': t(
          'inputs.array.insert-menu.toggle-list-view.tooltip',
        ),
      }}
    />
  )
}
