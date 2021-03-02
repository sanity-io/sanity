import {ArraySchemaType, isReferenceSchemaType, SchemaType} from '@sanity/types'
import {AddIcon} from '@sanity/icons'
import React from 'react'
import {Button, Grid, Menu, MenuButton, MenuItem} from '@sanity/ui'
import {useId} from '@reach/auto-id'
import PatchEvent from '../../../PatchEvent'
import {ArrayMember} from '../ArrayOfObjectsInput/types'

// These are the props any implementation of the ArrayFunctions part will receive
interface ArrayFunctionsProps {
  /* eslint-disable react/no-unused-prop-types */
  className?: string
  type: ArraySchemaType
  children: Node | null
  value: ArrayMember[]
  readOnly: boolean | null
  onAppendItem: (itemValue: ArrayMember) => void
  onPrependItem: (itemValue: ArrayMember) => void
  onFocusItem: (item: ArrayMember) => void
  onCreateValue: (type: SchemaType) => ArrayMember
  onChange: (event: PatchEvent) => void
  /* eslint-enable react/no-unused-prop-types */
}

export default function ArrayFunctions(props: ArrayFunctionsProps) {
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
