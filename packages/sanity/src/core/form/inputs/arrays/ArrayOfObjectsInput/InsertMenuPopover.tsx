import {
  InsertMenu as SanityInsertMenu,
  type InsertMenuProps as SanityInsertMenuProps,
} from '@sanity/insert-menu'
import {type SchemaType} from '@sanity/types'
import {useClickOutside, useGlobalKeyDown} from '@sanity/ui'
import {useCallback, useReducer, useState} from 'react'
import {useTranslation} from 'sanity'

import {Popover, type PopoverProps} from '../../../../../ui-components'

type PopoverState = {open: boolean}

type PopoverEvent = {type: 'toggle'} | {type: 'close'}

function popoverReducer(state: PopoverState, event: PopoverEvent): PopoverState {
  if (event.type === 'toggle') {
    if (state.open) {
      return {open: false}
    }

    return {open: true}
  }

  return {
    open: false,
  }
}

/**
 * @internal
 */
export type InsertMenuPopoverProps = {
  insertMenuProps: InsertMenuProps
  popoverProps: Omit<PopoverProps, 'content' | 'open'>
  renderToggle: (props: {
    state: PopoverState
    send: React.Dispatch<PopoverEvent>
    setToggleElement: React.Dispatch<React.SetStateAction<HTMLElement | null>>
  }) => JSX.Element
}

/**
 * Popover for rendering an `InsertMenu`
 * @internal
 */
export function InsertMenuPopover(props: InsertMenuPopoverProps): JSX.Element {
  const [state, send] = useReducer(popoverReducer, {open: false})
  const [popoverElement, setPopoverElement] = useState<HTMLDivElement | null>(null)
  const [toggleElement, setToggleElement] = useState<HTMLElement | null>(null)
  const {onSelect, ...insertMenuProps} = props.insertMenuProps

  useClickOutside(
    useCallback(() => {
      send({type: 'close'})
    }, []),
    [popoverElement, toggleElement],
  )

  useGlobalKeyDown(
    useCallback(
      (event: KeyboardEvent) => {
        if (event.key === 'Escape' && state.open) {
          send({type: 'close'})
          toggleElement?.focus()
        }
      },
      [state, toggleElement],
    ),
  )

  const handleOnSelect = useCallback(
    (schemaType: SchemaType) => {
      onSelect(schemaType)
      send({type: 'close'})
    },
    [onSelect],
  )

  return (
    <Popover
      ref={setPopoverElement}
      open={state.open}
      constrainSize
      overflow="hidden"
      portal
      content={<InsertMenu {...insertMenuProps} onSelect={handleOnSelect} />}
      {...props.popoverProps}
    >
      {props.renderToggle({state, send, setToggleElement})}
    </Popover>
  )
}

/**
 * @internal
 */
export type InsertMenuProps = Omit<SanityInsertMenuProps, 'labels'>

/**
 * `InsertMenu` with pre-configured `labels`
 * @internal
 */
export function InsertMenu(props: InsertMenuProps): React.JSX.Element {
  const {t} = useTranslation()

  return (
    <SanityInsertMenu
      {...props}
      labels={{
        'insert-menu.filter.all-items': t('insert-menu.filter.all-items'),
        'insert-menu.search.no-results': t('insert-menu.search.no-results'),
        'insert-menu.search.placeholder': t('insert-menu.search.placeholder'),
        'insert-menu.toggle-grid-view.tooltip': t('insert-menu.toggle-grid-view.tooltip'),
        'insert-menu.toggle-list-view.tooltip': t('insert-menu.toggle-list-view.tooltip'),
      }}
    />
  )
}
