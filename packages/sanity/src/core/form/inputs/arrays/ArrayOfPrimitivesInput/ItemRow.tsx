import {CopyIcon as DuplicateIcon, TrashIcon} from '@sanity/icons'
import {type SchemaType} from '@sanity/types'
import {Box, Flex, Menu} from '@sanity/ui'
import {type ForwardedRef, forwardRef, useCallback, useMemo} from 'react'

import {MenuButton, MenuItem} from '../../../../../ui-components'
import {ContextMenuButton} from '../../../../components/contextMenuButton'
import {useTranslation} from '../../../../i18n'
import {FieldPresence} from '../../../../presence'
import {FormFieldValidationStatus} from '../../../components/formField'
import {type PrimitiveItemProps} from '../../../types/itemProps'
import {InsertMenuGroups} from '../ArrayOfObjectsInput/InsertMenuGroups'
import {RowLayout} from '../layouts/RowLayout'
import {getEmptyValue} from './getEmptyValue'

export type DefaultItemProps = Omit<PrimitiveItemProps, 'renderDefault'> & {
  insertableTypes: SchemaType[]
  sortable: boolean
}

const MENU_BUTTON_POPOVER_PROPS = {portal: true, tone: 'default'} as const

export const ItemRow = forwardRef(function ItemRow(
  props: DefaultItemProps,
  ref: ForwardedRef<HTMLDivElement>,
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

  const {t} = useTranslation()

  const menu = (
    <MenuButton
      button={<ContextMenuButton />}
      id={`${inputId}-menuButton`}
      popover={MENU_BUTTON_POPOVER_PROPS}
      menu={
        <Menu>
          <MenuItem
            text={t('inputs.array.action.remove')}
            tone="critical"
            icon={TrashIcon}
            onClick={onRemove}
          />
          <MenuItem
            text={t('inputs.array.action.duplicate')}
            icon={DuplicateIcon}
            onClick={handleDuplicate}
          />
          <InsertMenuGroups types={insertableTypes} onInsert={handleInsert} />
        </Menu>
      }
    />
  )

  return (
    <RowLayout
      tone={tone}
      readOnly={!!readOnly}
      menu={!readOnly && menu}
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
