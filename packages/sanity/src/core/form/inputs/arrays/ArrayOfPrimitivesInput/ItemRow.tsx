import React, {useCallback, useMemo} from 'react'
import {Box, Button, Card, Flex, Menu, MenuButton, MenuItem} from '@sanity/ui'
import {SchemaType} from '@sanity/types'
import {CopyIcon as DuplicateIcon, EllipsisVerticalIcon, TrashIcon} from '@sanity/icons'
import {useId} from '@reach/auto-id'
import {FormFieldValidationStatus} from '../../../components/formField'
import {DragHandle} from '../common/DragHandle'
import {ItemWithMissingType} from '../ArrayOfObjectsInput/item/ItemWithMissingType'
import {InsertMenu} from '../ArrayOfObjectsInput/InsertMenu'
import {PrimitiveItemProps} from '../../../types/itemProps'
import {getEmptyValue} from './getEmptyValue'

const dragHandle = <DragHandle paddingX={1} paddingY={3} />

export type DefaultItemProps = PrimitiveItemProps & {
  insertableTypes: SchemaType[]
  onEnterKey: (item: number) => void
  onEscapeKey: (item: number) => void
  index: number
  isSortable: boolean
}

export const ItemRow = React.forwardRef(function ItemRow(
  props: DefaultItemProps,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  const {
    isSortable,
    value,
    index,
    onEscapeKey,
    onEnterKey,
    insertableTypes,
    onInsert,
    onRemove,
    readOnly,
    onFocus,
    validation,
    schemaType,
  } = props

  const hasError = validation.filter((item) => item.level === 'error').length > 0
  const hasWarning = validation.filter((item) => item.level === 'warning').length > 0

  const showValidationStatus = !readOnly && validation.length > 0 && !schemaType?.title

  const handleRemove = useCallback(() => {
    onRemove()
  }, [onRemove])

  const handleInsert = useCallback(
    (pos: 'before' | 'after', insertType: SchemaType) => {
      onInsert({position: pos, items: [getEmptyValue(insertType)]})
    },
    [onInsert]
  )

  const handleDuplicate = useCallback(() => {
    if (value) onInsert({position: 'after', items: [value]})
  }, [onInsert, value])

  const handleKeyPress = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter') {
        onEnterKey(index)
      }
    },
    [index, onEnterKey]
  )

  const handleKeyUp = useCallback(
    (event: React.KeyboardEvent<any>) => {
      if (event.shiftKey && event.key === 'Backspace' && value === '') {
        onRemove()
      }

      if (event.key === 'Escape') {
        onEscapeKey(index)
      }
    },
    [index, onEscapeKey, onRemove, value]
  )

  const tone = useMemo(() => {
    if (hasError) {
      return 'critical'
    }
    if (hasWarning) {
      return 'caution'
    }

    return undefined
  }, [hasError, hasWarning])

  const id = useId()

  return (
    <Card tone={tone} radius={2} paddingX={1} paddingY={2}>
      <Flex align={schemaType ? 'flex-end' : 'center'} ref={ref}>
        {schemaType ? (
          <Flex align="flex-end" flex={1}>
            {isSortable && <Box marginRight={1}>{dragHandle}</Box>}

            <Box flex={1} marginRight={2}>
              {props.children}
            </Box>
          </Flex>
        ) : (
          <Box flex={1}>
            <ItemWithMissingType value={value} onFocus={onFocus} />
          </Box>
        )}

        <Flex align="center" marginLeft={2}>
          {showValidationStatus && (
            <Box marginRight={3}>
              <FormFieldValidationStatus validation={validation} />
            </Box>
          )}

          {/*{showPresence && (*/}
          {/*  // if title is set on type, presence avatars will be shown in the input' formfield instead*/}
          {/*  <Box marginRight={1}>*/}
          {/*    <FieldPresence presence={presence} maxAvatars={1} />*/}
          {/*  </Box>*/}
          {/*)}*/}

          {!readOnly && (
            <Box paddingY={1}>
              <MenuButton
                button={<Button padding={2} mode="bleed" icon={EllipsisVerticalIcon} />}
                id={`${id}-menuButton`}
                portal
                popover={{portal: true, tone: 'default'}}
                menu={
                  <Menu>
                    <MenuItem
                      text="Remove"
                      tone="critical"
                      icon={TrashIcon}
                      onClick={handleRemove}
                    />

                    <MenuItem text="Duplicate" icon={DuplicateIcon} onClick={handleDuplicate} />
                    <InsertMenu types={insertableTypes} onInsert={handleInsert} />
                  </Menu>
                }
              />
            </Box>
          )}
        </Flex>
      </Flex>
    </Card>
  )
})
