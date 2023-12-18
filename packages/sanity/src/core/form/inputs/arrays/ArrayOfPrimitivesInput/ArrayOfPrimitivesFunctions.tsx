/* eslint-disable react/no-unused-prop-types */
import {ArraySchemaType, isReferenceSchemaType} from '@sanity/types'
import {AddIcon} from '@sanity/icons'
import React, {useMemo, useId} from 'react'
import {Grid, Menu} from '@sanity/ui'
import {ArrayInputFunctionsProps} from '../../../types'
import {Tooltip, Button, MenuButton, MenuItem} from '../../../../../ui-components'
import {useTranslation} from '../../../../i18n'

/**
 * @hidden
 * @beta */
export function ArrayOfPrimitivesFunctions<
  MemberType extends string | boolean | number,
  SchemaType extends ArraySchemaType,
>(props: ArrayInputFunctionsProps<MemberType, SchemaType>) {
  const {schemaType, readOnly, children, onValueCreate, onItemAppend} = props
  const menuButtonId = useId()
  const {t} = useTranslation()

  const insertItem = React.useCallback(
    (itemType: any) => {
      onItemAppend(onValueCreate(itemType))
    },
    [onValueCreate, onItemAppend],
  )

  const handleAddBtnClick = React.useCallback(() => {
    insertItem(schemaType.of[0])
  }, [schemaType, insertItem])

  const popoverProps = useMemo(() => ({constrainSize: true, portal: true}), [])

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
          <Button icon={AddIcon} mode="ghost" disabled size="large" text={t(addItemI18nKey)} />
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
          text={t(addItemI18nKey)}
        />
      ) : (
        <MenuButton
          button={<Button icon={AddIcon} mode="ghost" size="large" text={t(addItemI18nKey)} />}
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
          popover={popoverProps}
        />
      )}

      {children}
    </Grid>
  )
}
