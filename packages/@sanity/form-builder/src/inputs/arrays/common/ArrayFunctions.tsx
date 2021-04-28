import {ArraySchemaType, isReferenceSchemaType} from '@sanity/types'
import {AddIcon} from '@sanity/icons'
import React, {ReactNode} from 'react'
import {Button, Grid, Menu, MenuButton, MenuItem} from '@sanity/ui'
import {useId} from '@reach/auto-id'
import PatchEvent from '../../../PatchEvent'

// These are the props any implementation of the ArrayFunctions part will receive
export interface ArrayFunctionsProps<SchemaType extends ArraySchemaType, MemberType> {
  className?: string
  type: SchemaType
  children?: ReactNode
  value?: MemberType[]
  readOnly: boolean | null
  onAppendItem: (itemValue: MemberType) => void
  onPrependItem: (itemValue: MemberType) => void
  onFocusItem: (item: MemberType, index: number) => void
  onCreateValue: (type: SchemaType) => MemberType
  onChange: (event: PatchEvent) => void
}

export default function ArrayFunctions<MemberType>(
  props: ArrayFunctionsProps<ArraySchemaType, MemberType>
) {
  const {type, readOnly, children, onCreateValue, onAppendItem} = props
  const menuButtonId = useId()

  const insertItem = React.useCallback(
    (itemType) => {
      const item = onCreateValue(itemType)

      onAppendItem(item)
    },
    [onCreateValue, onAppendItem]
  )

  const handleAddBtnClick = React.useCallback(() => {
    insertItem(type.of[0])
  }, [type, insertItem])

  if (readOnly) {
    return null
  }

  return (
    <Grid gap={1} style={{gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))'}}>
      {type.of.length === 1 ? (
        <Button icon={AddIcon} mode="ghost" onClick={handleAddBtnClick} text="Add item" />
      ) : (
        <MenuButton
          button={<Button icon={AddIcon} mode="ghost" text="Add item…" />}
          id={menuButtonId || ''}
          menu={
            <Menu>
              {type.of.map((memberDef, i) => {
                // Use reference icon if reference is to one type only
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
        />
      )}

      {children}
    </Grid>
  )
}

ArrayFunctions.__SANITY_INTERNAL_IMPLEMENTATION = true
