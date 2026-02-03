import {InsertAboveIcon, InsertBelowIcon} from '@sanity/icons'
import {type InsertMenuOptions} from '@sanity/insert-menu'
import {type SchemaType} from '@sanity/types'
import {useCallback, useMemo} from 'react'

import {MenuItem} from '../../../../../ui-components'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {useInsertMenuPopover} from './InsertMenuPopover'

/**
 * @internal
 */
type InsertMenuItemsProps = {
  insertMenuOptions?: InsertMenuOptions
  onInsert: (pos: 'before' | 'after', type: SchemaType) => void
  referenceElement: HTMLElement | null
  schemaTypes?: SchemaType[]
}

/**
 * @internal
 */
export function useInsertMenuMenuItems(props: InsertMenuItemsProps) {
  const {t} = useTranslation()
  const {onInsert, schemaTypes: types} = props
  const insertBefore = useInsertMenuPopover({
    insertMenuProps: {
      ...props.insertMenuOptions,
      schemaTypes: props.schemaTypes ?? [],
      onSelect: (insertType) => {
        props.onInsert('before', insertType)
      },
    },
    popoverProps: {
      referenceElement: props.referenceElement,
      placement: 'top-end',
      fallbackPlacements: ['bottom-end'],
    },
  })
  const insertAfter = useInsertMenuPopover({
    insertMenuProps: {
      ...props.insertMenuOptions,
      schemaTypes: props.schemaTypes ?? [],
      onSelect: (insertType) => {
        props.onInsert('after', insertType)
      },
    },
    popoverProps: {
      referenceElement: props.referenceElement,
      placement: 'bottom-end',
      fallbackPlacements: ['top-end'],
    },
  })
  const handleToggleInsertBefore = useCallback(() => {
    if (!types) {
      return
    }

    if (types.length === 1) {
      onInsert('before', types[0])
    } else {
      insertBefore.send({type: 'toggle'})
    }
  }, [insertBefore, onInsert, types])
  const handleToggleInsertAfter = useCallback(() => {
    if (!types) {
      return
    }

    if (types.length === 1) {
      onInsert('after', types[0])
    } else {
      insertAfter.send({type: 'toggle'})
    }
  }, [insertAfter, onInsert, types])

  const insertBeforeMenuItem = useMemo(
    () =>
      types ? (
        <MenuItem
          key="insertBefore"
          text={
            types.length === 1
              ? t('inputs.array.action.add-before')
              : `${t('inputs.array.action.add-before')}...`
          }
          icon={InsertAboveIcon}
          onClick={handleToggleInsertBefore}
        />
      ) : null,
    [handleToggleInsertBefore, t, types],
  )
  const insertAfterMenuItem = useMemo(
    () =>
      types ? (
        <MenuItem
          key="insertAfter"
          text={
            types.length === 1
              ? t('inputs.array.action.add-after')
              : `${t('inputs.array.action.add-after')}...`
          }
          icon={InsertBelowIcon}
          onClick={handleToggleInsertAfter}
        />
      ) : null,
    [handleToggleInsertAfter, t, types],
  )

  return {
    insertBefore: {
      ...insertBefore,
      menuItem: insertBeforeMenuItem,
    },
    insertAfter: {
      ...insertAfter,
      menuItem: insertAfterMenuItem,
    },
  }
}
