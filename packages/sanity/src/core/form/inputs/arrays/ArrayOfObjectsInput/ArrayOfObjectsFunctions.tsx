import {AddIcon} from '@sanity/icons'
import {type ArraySchemaType} from '@sanity/types'
import {Grid, Menu} from '@sanity/ui'
import {useCallback, useId} from 'react'

import {
  Button,
  MenuButton,
  type MenuButtonProps,
  MenuItem,
  Tooltip,
} from '../../../../../ui-components'
import {useTranslation} from '../../../../i18n'
import {type ArrayInputFunctionsProps, type ObjectItem} from '../../../types'
import {getSchemaTypeIcon} from './getSchemaTypeIcon'

const POPOVER_PROPS: MenuButtonProps['popover'] = {
  constrainSize: true,
  portal: true,
  fallbackPlacements: ['top', 'bottom'],
}

/**
 * @hidden
 * @beta */
export function ArrayOfObjectsFunctions<
  Item extends ObjectItem,
  SchemaType extends ArraySchemaType,
>(props: ArrayInputFunctionsProps<Item, SchemaType>) {
  const {schemaType, readOnly, children, onValueCreate, onItemAppend} = props
  const menuButtonId = useId()
  const {t} = useTranslation()

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

  if (readOnly) {
    return (
      <Tooltip portal content={t('inputs.array.read-only-label')}>
        <Grid>
          <Button
            icon={AddIcon}
            mode="ghost"
            disabled
            size="large"
            data-testid="add-read-object-button"
            text={t(addItemI18nKey)}
          />
        </Grid>
      </Tooltip>
    )
  }

  return (
    <Grid gap={1} style={{gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))'}}>
      {schemaType.of.length === 1 ? (
        <Button
          icon={AddIcon}
          mode="ghost"
          onClick={handleAddBtnClick}
          size="large"
          data-testid="add-single-object-button"
          text={t(addItemI18nKey)}
        />
      ) : (
        <MenuButton
          button={
            <Button
              icon={AddIcon}
              mode="ghost"
              size="large"
              data-testid="add-multiple-object-button"
              text={t(addItemI18nKey)}
            />
          }
          id={menuButtonId || ''}
          menu={
            <Menu>
              {schemaType.of.map((memberDef, i) => {
                return (
                  <MenuItem
                    key={i}
                    text={memberDef.title || memberDef.type?.name}
                    onClick={() => insertItem(memberDef)}
                    icon={getSchemaTypeIcon(memberDef)}
                  />
                )
              })}
            </Menu>
          }
          popover={POPOVER_PROPS}
        />
      )}

      {children}
    </Grid>
  )
}
