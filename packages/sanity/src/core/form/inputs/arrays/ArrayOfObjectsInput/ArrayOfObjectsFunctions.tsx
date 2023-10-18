import {ArraySchemaType, isReferenceSchemaType} from '@sanity/types'
import {AddIcon} from '@sanity/icons'
import React, {useId, useCallback} from 'react'
import {Button, Grid, Menu, MenuButton, MenuItem, MenuButtonProps} from '@sanity/ui'
import {Tooltip} from '../../../../../ui'
import {ArrayInputFunctionsProps, ObjectItem} from '../../../types'

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

  if (readOnly) {
    return (
      <Tooltip text="This field is read-only">
        <Grid>
          <Button
            icon={AddIcon}
            mode="ghost"
            disabled
            text={schemaType.of.length === 1 ? 'Add item' : 'Add item...'}
          />
        </Grid>
      </Tooltip>
    )
  }

  return (
    <Grid gap={1} style={{gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))'}}>
      {schemaType.of.length === 1 ? (
        <Button icon={AddIcon} mode="ghost" onClick={handleAddBtnClick} text="Add item" />
      ) : (
        <MenuButton
          button={<Button icon={AddIcon} mode="ghost" text="Add item…" />}
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
