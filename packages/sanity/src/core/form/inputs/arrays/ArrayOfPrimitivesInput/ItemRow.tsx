import {AddDocumentIcon, CopyIcon, InsertAboveIcon, InsertBelowIcon, TrashIcon} from '@sanity/icons'
import {type SchemaType} from '@sanity/types'
import {Box, Flex, Menu} from '@sanity/ui'
import {type ForwardedRef, forwardRef, useCallback, useMemo} from 'react'

import {MenuButton, MenuItem} from '../../../../../ui-components'
import {ContextMenuButton} from '../../../../components/contextMenuButton'
import {useTranslation} from '../../../../i18n'
import {FieldPresence} from '../../../../presence'
import {FormFieldValidationStatus} from '../../../components/formField'
import {type PrimitiveItemProps} from '../../../types/itemProps'
import {InsertMenuGroup} from '../ArrayOfObjectsInput/InsertMenuGroups'
import {RowLayout} from '../layouts/RowLayout'
import {getEmptyValue} from './getEmptyValue'

export type DefaultItemProps = Omit<PrimitiveItemProps, 'renderDefault'> & {
  insertableTypes: SchemaType[]
  sortable: boolean
}

const MENU_BUTTON_POPOVER_PROPS = {portal: true, tone: 'default'} as const
const EMPTY_ARRAY: never[] = []

export const ItemRow = forwardRef(function ItemRow(
  props: DefaultItemProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const {
    sortable,
    value,
    insertableTypes,
    onInsert,
    onCopy,
    onRemove,
    readOnly,
    inputId,
    parentSchemaType,
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

  const handleCopy = useCallback(() => {
    onCopy({
      items: [value],
    })
  }, [onCopy, value])

  const tone = useMemo(() => {
    if (hasError) {
      return 'critical'
    }
    if (hasWarning) {
      return 'caution'
    }

    return undefined
  }, [hasError, hasWarning])

  const {t} = useTranslation()

  const disableActions = parentSchemaType.options?.disableActions || EMPTY_ARRAY

  const menuItems = useMemo(
    () =>
      [
        !disableActions.includes('remove') && (
          <MenuItem
            key="remove"
            text={t('inputs.array.action.remove')}
            tone="critical"
            icon={TrashIcon}
            onClick={onRemove}
          />
        ),
        !disableActions.includes('copy') && (
          <MenuItem
            key="copy"
            text={t('inputs.array.action.copy')}
            icon={CopyIcon}
            onClick={handleCopy}
          />
        ),
        !disableActions.includes('duplicate') && (
          <MenuItem
            key="duplicate"
            text={t('inputs.array.action.duplicate')}
            icon={AddDocumentIcon}
            onClick={handleDuplicate}
          />
        ),
        !(disableActions.includes('add') || disableActions.includes('addBefore')) && (
          <InsertMenuGroup
            pos="before"
            types={insertableTypes}
            onInsert={handleInsert}
            text={t('inputs.array.action.add-before')}
            icon={InsertAboveIcon}
          />
        ),
        !disableActions.includes('add') && !disableActions.includes('addAfter') && (
          <InsertMenuGroup
            pos="after"
            types={insertableTypes}
            onInsert={handleInsert}
            text={t('inputs.array.action.add-after')}
            icon={InsertBelowIcon}
          />
        ),
      ].filter(Boolean),
    [disableActions, handleCopy, handleDuplicate, handleInsert, insertableTypes, onRemove, t],
  )

  const menu = useMemo(
    () =>
      readOnly || menuItems.length === 0 ? null : (
        <MenuButton
          button={<ContextMenuButton />}
          id={`${inputId}-menuButton`}
          popover={MENU_BUTTON_POPOVER_PROPS}
          menu={<Menu>{menuItems}</Menu>}
        />
      ),
    [inputId, menuItems, readOnly],
  )
  return (
    <RowLayout
      tone={tone}
      readOnly={!!readOnly}
      menu={menu}
      dragHandle={sortable}
      presence={presence.length === 0 ? null : <FieldPresence presence={presence} maxAvatars={1} />}
      validation={
        validation.length > 0 ? (
          <Box paddingX={1} paddingY={3}>
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
