/* eslint-disable react/no-unused-prop-types */
import {ArraySchemaType, isReferenceSchemaType} from '@sanity/types'
import {AddIcon} from '@sanity/icons'
import React, {useMemo, useId} from 'react'
import {Grid, Menu, MenuButton, MenuItem} from '@sanity/ui'
import {ArrayInputFunctionsProps} from '../../../types'
import {Tooltip, Button} from '../../../../../ui'

/**
 * @hidden
 * @beta */
export function ArrayOfPrimitivesFunctions<
  MemberType extends string | boolean | number,
  SchemaType extends ArraySchemaType,
>(props: ArrayInputFunctionsProps<MemberType, SchemaType>) {
  const {schemaType, readOnly, children, onValueCreate, onItemAppend} = props
  const menuButtonId = useId()

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

  if (readOnly) {
    return (
      <Tooltip portal content="This field is read-only">
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
          popover={popoverProps}
        />
      )}

      {children}
    </Grid>
  )
}
