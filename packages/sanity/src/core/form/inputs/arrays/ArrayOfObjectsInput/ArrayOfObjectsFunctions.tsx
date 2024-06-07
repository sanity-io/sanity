/* eslint-disable no-nested-ternary, react/jsx-no-bind */
import {AddIcon} from '@sanity/icons'
import {InsertMenu, type InsertMenuOptions} from '@sanity/insert-menu'
import {type ArraySchemaType, type SchemaType} from '@sanity/types'
import {Grid, Popover, useClickOutside, useGlobalKeyDown} from '@sanity/ui'
import {useCallback, useReducer, useState} from 'react'

import {Button, Tooltip} from '../../../../../ui-components'
import {useTranslation} from '../../../../i18n'
import {type ArrayInputFunctionsProps, type ObjectItem} from '../../../types'

/**
 * @hidden
 * @beta */
export function ArrayOfObjectsFunctions<
  Item extends ObjectItem,
  TSchemaType extends ArraySchemaType,
>(props: ArrayInputFunctionsProps<Item, TSchemaType>) {
  const {schemaType, readOnly, children, onValueCreate, onItemAppend} = props
  const {t} = useTranslation()
  const [gridElement, setGridElement] = useState<HTMLDivElement | null>(null)

  const insertItem = useCallback(
    (itemType: any) => {
      const item = onValueCreate(itemType)

      onItemAppend(item)
    },
    [onValueCreate, onItemAppend],
  )

  const handleAddBtnClick = useCallback(() => {
    insertItem(schemaType.of[0])
  }, [schemaType, insertItem])

  // If we have more than a single type candidate, we render a menu, so the button might show
  // "Add item..." instead of simply "Add item", to indicate that further choices are available.
  const addItemI18nKey =
    schemaType.of.length > 1
      ? 'inputs.array.action.add-item-select-type'
      : 'inputs.array.action.add-item'

  const insertButtonProps: React.ComponentProps<typeof Button> = {
    icon: AddIcon,
    mode: 'ghost',
    size: 'large',
    text: t(addItemI18nKey),
  }

  if (readOnly) {
    return (
      <Tooltip portal content={t('inputs.array.read-only-label')}>
        <Grid>
          <Button {...insertButtonProps} data-testid="add-read-object-button" disabled />
        </Grid>
      </Tooltip>
    )
  }

  return (
    <Grid
      ref={setGridElement}
      gap={1}
      style={{gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))'}}
    >
      {schemaType.of.length === 1 ? (
        <Button
          {...insertButtonProps}
          onClick={handleAddBtnClick}
          data-testid="add-single-object-button"
        />
      ) : (
        <AddMultipleButton
          insertButtonProps={{...insertButtonProps, 'data-testid': 'add-multiple-object-button'}}
          insertMenuOptions={props.schemaType.options?.insertMenu}
          schemaTypes={props.schemaType.of}
          onSelect={insertItem}
          referenceBoundary={gridElement}
        />
      )}
      {children}
    </Grid>
  )
}

type AddMultipleState = {
  open: boolean
}

type AddMultipleEvent = {type: 'toggle'} | {type: 'close'}

function addMultipleReducer(state: AddMultipleState, event: AddMultipleEvent) {
  return {
    open: event.type === 'toggle' ? !state.open : event.type === 'close' ? false : state.open,
  }
}

type AddMultipleButtonProps = {
  schemaTypes: Array<SchemaType>
  onSelect: (schemaType: SchemaType) => void
  insertButtonProps: React.ComponentProps<typeof Button> & {'data-testid': string}
  insertMenuOptions?: InsertMenuOptions
  referenceBoundary?: HTMLElement | null
}

function AddMultipleButton(props: AddMultipleButtonProps) {
  const {t} = useTranslation()
  const [state, send] = useReducer(addMultipleReducer, {open: false})
  const [button, setButton] = useState<HTMLButtonElement | null>(null)
  const [popover, setPopover] = useState<HTMLDivElement | null>(null)

  useClickOutside(
    useCallback(() => {
      send({type: 'close'})
    }, []),
    [button, popover],
  )

  useGlobalKeyDown(
    useCallback(
      (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          send({type: 'close'})
          button?.focus()
        }
      },
      [button],
    ),
  )

  const {onSelect} = props
  const handleOnSelect = useCallback(
    (schemaType: SchemaType) => {
      onSelect(schemaType)
      send({type: 'close'})
    },
    [onSelect],
  )

  return (
    <Popover
      constrainSize
      content={
        <InsertMenu
          {...props.insertMenuOptions}
          onSelect={handleOnSelect}
          schemaTypes={props.schemaTypes}
          labels={{
            'insert-menu.filter.all-items': t('insert-menu.filter.all-items'),
            'insert-menu.search.no-results': t('insert-menu.search.no-results'),
            'insert-menu.search.placeholder': t('insert-menu.search.placeholder'),
            'insert-menu.toggle-grid-view.tooltip': t('insert-menu.toggle-grid-view.tooltip'),
            'insert-menu.toggle-list-view.tooltip': t('insert-menu.toggle-list-view.tooltip'),
          }}
        />
      }
      fallbackPlacements={['top']}
      matchReferenceWidth={props.insertMenuOptions?.filter}
      open={state.open}
      overflow="hidden"
      placement="bottom"
      portal
      ref={setPopover}
      referenceBoundary={props.referenceBoundary}
    >
      <Button
        {...props.insertButtonProps}
        ref={setButton}
        selected={state.open}
        onClick={() => {
          send({type: 'toggle'})
        }}
      />
    </Popover>
  )
}
