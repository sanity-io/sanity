/* eslint-disable react/jsx-no-bind */
import {AddIcon} from '@sanity/icons'
import {type ArraySchemaType} from '@sanity/types'
import {Grid} from '@sanity/ui'
import {useCallback, useState} from 'react'

import {Button, Tooltip} from '../../../../../ui-components'
import {useTranslation} from '../../../../i18n'
import {type ArrayInputFunctionsProps, type ObjectItem} from '../../../types'
import {useInsertMenuPopover} from './InsertMenuPopover'

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
  const [popoverToggleElement, setPopoverToggleElement] = useState<HTMLButtonElement | null>(null)

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

  const handleAddMultipleBtnClick = useCallback(() => {
    // eslint-disable-next-line no-console
    console.log('multi btn clicked')
  }, [])

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

  const insertMenu = useInsertMenuPopover({
    insertMenuProps: {
      ...props.schemaType.options?.insertMenu,
      schemaTypes: props.schemaType.of,
      onSelect: insertItem,
    },
    popoverProps: {
      placement: 'bottom',
      fallbackPlacements: ['top'],
      matchReferenceWidth: props.schemaType.options?.insertMenu?.views?.some(
        (view) => view.name === 'grid',
      ),
      referenceBoundary: gridElement,
      referenceElement: popoverToggleElement,
    },
  })

  if (readOnly) {
    return (
      <Tooltip portal content={t('inputs.array.read-only-label')}>
        <Grid>
          <Button {...insertButtonProps} data-testid="add-read-object-button" disabled />
        </Grid>
      </Tooltip>
    )
  }

  const containsImage = schemaType.of.some((item) => item.type && item.type.name === 'image')

  return (
    <Grid
      ref={setGridElement}
      gap={1}
      style={{gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))'}}
    >
      {schemaType.of.length === 1 ? (
        <>
          <Button
            {...insertButtonProps}
            onClick={handleAddBtnClick}
            data-testid="add-single-object-button"
          />

          {containsImage && (
            <Button
              icon={AddIcon}
              mode="ghost"
              onClick={handleAddMultipleBtnClick}
              size="large"
              // eslint-disable-next-line @sanity/i18n/no-attribute-string-literals
              text={'Add Multiples'}
            />
          )}
        </>
      ) : (
        <>
          <Button
            {...insertButtonProps}
            data-testid="add-multiple-object-button"
            selected={insertMenu.state.open}
            onClick={() => {
              insertMenu.send({type: 'toggle'})
            }}
            ref={setPopoverToggleElement}
          />
          {insertMenu.popover}
        </>
      )}
      {children}
    </Grid>
  )
}
