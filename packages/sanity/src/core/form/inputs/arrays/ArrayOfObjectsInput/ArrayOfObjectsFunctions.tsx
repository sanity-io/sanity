import {ArraySchemaType, isReferenceSchemaType} from '@sanity/types'
import {AddIcon} from '@sanity/icons'
import React, {useId, useCallback} from 'react'
import {
  Box,
  Button,
  Grid,
  Menu,
  MenuButton,
  MenuItem,
  Tooltip,
  Text,
  MenuButtonProps,
} from '@sanity/ui'
import {ArrayInputFunctionsProps, ObjectItem} from '../../../types'
import {useTranslation} from '../../../../i18n'

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

  const handleAddBtnClick = React.useCallback(() => {
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
      <Tooltip
        portal
        content={
          <Box padding={2} sizing="border">
            <Text size={1}>{t('inputs.array.read-only-label')}</Text>
          </Box>
        }
      >
        <Grid>
          <Button icon={AddIcon} mode="ghost" disabled text={t(addItemI18nKey)} />
        </Grid>
      </Tooltip>
    )
  }

  return (
    <Grid gap={1} style={{gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))'}}>
      {schemaType.of.length === 1 ? (
        <Button icon={AddIcon} mode="ghost" onClick={handleAddBtnClick} text={t(addItemI18nKey)} />
      ) : (
        <MenuButton
          button={<Button icon={AddIcon} mode="ghost" text={t(addItemI18nKey)} />}
          id={menuButtonId || ''}
          menu={
            <Menu>
              {schemaType.of.map((memberDef, i) => {
                // Use reference icon if reference is to one schemaType only
                const referenceIcon =
                  isReferenceSchemaType(memberDef) &&
                  (memberDef.to || []).length === 1 &&
                  memberDef.to[0].icon

                const icon = memberDef.icon || memberDef.type?.icon || referenceIcon
                return (
                  <MenuItem
                    key={i}
                    text={memberDef.title || memberDef.type?.name}
                    onClick={() => insertItem(memberDef)}
                    icon={icon}
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
