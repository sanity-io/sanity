import React, {useCallback, useMemo} from 'react'
import {Box, Flex, Menu, MenuButton} from '@sanity/ui'
import {SchemaType} from '@sanity/types'
import {CopyIcon as DuplicateIcon, EllipsisVerticalIcon, TrashIcon} from '@sanity/icons'
import {FormFieldValidationStatus} from '../../../components/formField'
import {InsertMenu} from '../ArrayOfObjectsInput/InsertMenu'
import {PrimitiveItemProps} from '../../../types/itemProps'
import {RowLayout} from '../layouts/RowLayout'
import {FieldPresence} from '../../../../presence'
import {Button, MenuItem} from '../../../../../ui'
import {getEmptyValue} from './getEmptyValue'

export type DefaultItemProps = Omit<PrimitiveItemProps, 'renderDefault'> & {
  insertableTypes: SchemaType[]
  sortable: boolean
}

const MENU_BUTTON_POPOVER_PROPS = {portal: true, tone: 'default'} as const

export const ItemRow = React.forwardRef(function ItemRow(
  props: DefaultItemProps,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    sortable,
    value,
    insertableTypes,
    onInsert,
    onRemove,
    readOnly,
    inputId,
    validation,
    children,
    presence,
    schemaType,
  } = props

  const hasError = validation.filter((item) => item.level === 'error').length > 0
  const hasWarning = validation.filter((item) => item.level === 'warning').length > 0

  const handleInsert = useCallback(
    (pos: 'before' | 'after', insertType: SchemaType) => {
      onInsert({position: pos, items: [getEmptyValue(insertType)]})
    },
    [onInsert],
  )

  const handleDuplicate = useCallback(() => {
    if (value) onInsert({position: 'after', items: [value]})
  }, [onInsert, value])

  const tone = useMemo(() => {
    if (hasError) {
      return 'critical'
    }
    if (hasWarning) {
      return 'caution'
    }

    return undefined
  }, [hasError, hasWarning])

  const menu = (
    <MenuButton
      button={<Button size="small" mode="bleed" icon={EllipsisVerticalIcon} />}
      id={`${inputId}-menuButton`}
      popover={MENU_BUTTON_POPOVER_PROPS}
      menu={
        <Menu>
          <MenuItem text="Remove" tone="critical" icon={TrashIcon} onClick={onRemove} />

          <MenuItem text="Duplicate" icon={DuplicateIcon} onClick={handleDuplicate} />
          <InsertMenu types={insertableTypes} onInsert={handleInsert} />
        </Menu>
      }
    />
  )

  return (
    <RowLayout
      tone={tone}
      menu={!readOnly && menu}
      dragHandle={!readOnly && sortable}
      presence={presence.length === 0 ? null : <FieldPresence presence={presence} maxAvatars={1} />}
      validation={
        validation.length > 0 ? (
          <Box marginLeft={1} paddingX={1} paddingY={3}>
            <FormFieldValidationStatus validation={validation} />
          </Box>
        ) : null
      }
    >
      <Flex align={schemaType ? 'flex-end' : 'center'} ref={ref}>
        <Flex align="flex-end" flex={1}>
          <Box flex={1} marginRight={2}>
            {children}
          </Box>
        </Flex>
      </Flex>
    </RowLayout>
  )
})
