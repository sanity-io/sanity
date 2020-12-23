import {ArraySchemaType, isReferenceSchemaType, SchemaType} from '@sanity/types'
import {AddIcon} from '@sanity/icons'
import React from 'react'
import {Box, Button, Flex, Menu, MenuButton, MenuItem} from '@sanity/ui'
import {useId} from '@reach/auto-id'
import PatchEvent from '../../PatchEvent'
import {ItemValue} from './typedefs'

// These are the props any implementation of the ArrayFunctions part will receive
interface ArrayFunctionsProps {
  /* eslint-disable react/no-unused-prop-types */
  className?: string
  type: ArraySchemaType
  children: Node | null
  value: ItemValue[]
  readOnly: boolean | null
  onAppendItem: (itemValue: ItemValue) => void
  onPrependItem: (itemValue: ItemValue) => void
  onFocusItem: (item: ItemValue) => void
  onCreateValue: (type: SchemaType) => ItemValue
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
    <Flex align="center">
      {type.of.length === 1 ? (
        <Box>
          <Button mode="ghost" text="Add" icon={AddIcon} onClick={handleAddBtnClick} />
        </Box>
      ) : (
        <Box flex={1}>
          <MenuButton
            id={menuButtonId || ''}
            button={<Button mode="ghost" text="Add…" icon={AddIcon} />}
            menu={
              <Menu>
                {type.of.map((memberDef) => {
                  // Use reference icon if reference is to one type only
                  const referenceIcon =
                    isReferenceSchemaType(memberDef) &&
                    (memberDef.to || []).length === 1 &&
                    memberDef.to[0].icon

                  const icon = memberDef.icon || memberDef.type?.icon || referenceIcon
                  return (
                    <MenuItem
                      key={memberDef.type?.name}
                      text={memberDef.title || memberDef.type?.name}
                      onClick={() => insertItem(memberDef)}
                      icon={icon}
                    />
                  )
                })}
              </Menu>
            }
          />
        </Box>
      )}

      {children && <Box flex={1}>{children}</Box>}
    </Flex>
  )
}

ArrayFunctions.__SANITY_INTERNAL_IMPLEMENTATION = true
