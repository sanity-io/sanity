/* eslint-disable no-nested-ternary */
import React, {useCallback} from 'react'
import {
  Badge,
  Box,
  Button,
  Card,
  CardTone,
  Flex,
  Menu,
  MenuButton,
  MenuItem,
  Text,
  Tooltip,
} from '@sanity/ui'
import {CopyIcon as DuplicateIcon, EllipsisVerticalIcon, TrashIcon} from '@sanity/icons'
import {useId} from '@reach/auto-id'
import {SchemaType} from '@sanity/types'
import {FormFieldValidationStatus} from '../../../../components/formField'
import {FieldPresence} from '../../../../../presence'
import {DragHandle} from '../../common/DragHandle'
import {randomKey} from '../../common/randomKey'
import {createProtoValue} from '../ArrayInput'
import {InsertMenu} from '../InsertMenu'
import {EMPTY_ARRAY} from '../../../../utils/empty'
import {ItemWithMissingType} from './ItemWithMissingType'
import {ItemLayoutProps} from './ItemLayoutProps'
import {RowWrapper} from './components/RowWrapper'

const dragHandle = <DragHandle paddingX={1} paddingY={3} />

const MENU_POPOVER_PROPS = {portal: true, tone: 'default'} as const

export const RowItem = React.forwardRef(function RegularItem(
  props: ItemLayoutProps,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  const focusRef = React.useRef<HTMLDivElement | null>(null)
  const {
    isSortable,
    value,
    onClick,
    onFocus,
    type,
    readOnly,
    presence,
    onInsert,
    insertableTypes,
    onRemove,
    renderPreview,
    validation = EMPTY_ARRAY,
    ...rest
  } = props

  const hasErrors = validation.some((v) => v.level === 'error')
  const hasWarnings = validation.some((v) => v.level === 'warning')

  const handleDuplicate = useCallback(() => {
    onInsert({
      items: [{...value, _key: randomKey()}],
      position: 'after',
    })
  }, [onInsert, value])

  const handleInsert = useCallback(
    (pos: 'before' | 'after', insertType: SchemaType) => {
      onInsert({
        items: [{...createProtoValue(insertType), _key: randomKey()}],
        position: pos,
      })
    },
    [onInsert]
  )
  const id = useId()
  return (
    <RowWrapper
      {...rest}
      ref={ref}
      radius={2}
      padding={1}
      tone={
        (readOnly
          ? 'transparent'
          : hasErrors
          ? 'critical'
          : hasWarnings
          ? 'caution'
          : 'default') as CardTone
      }
    >
      <Flex align="center">
        {isSortable && (
          <Card className="dragHandle" tone="inherit" marginRight={1}>
            {dragHandle}
          </Card>
        )}

        {type ? (
          <Card
            as="button"
            type="button"
            tone="inherit"
            radius={2}
            padding={1}
            flex={1}
            onClick={onClick}
            ref={focusRef}
            onFocus={onFocus}
            __unstable_focusRing
          >
            {renderPreview({
              layout:
                type.options && 'layout' in type.options && type.options?.layout === 'grid'
                  ? 'media'
                  : 'default',
              schemaType: type,
              value,
            })}
          </Card>
        ) : (
          <Box flex={1}>
            <ItemWithMissingType value={value} onFocus={onFocus} />
          </Box>
        )}

        <Flex align="center">
          {!readOnly && presence.length > 0 && (
            <Box marginLeft={1}>
              <FieldPresence presence={presence} maxAvatars={1} />
            </Box>
          )}

          {validation.length > 0 && (
            <Box marginLeft={1} paddingX={1} paddingY={3}>
              <FormFieldValidationStatus __unstable_showSummary={!value?._ref} />
            </Box>
          )}

          {!readOnly && (
            <MenuButton
              button={<Button padding={2} mode="bleed" icon={EllipsisVerticalIcon} />}
              id={`${id}-menuButton`}
              menu={
                <Menu>
                  <MenuItem text="Remove" tone="critical" icon={TrashIcon} onClick={onRemove} />
                  <MenuItem text="Duplicate" icon={DuplicateIcon} onClick={handleDuplicate} />
                  <InsertMenu types={insertableTypes} onInsert={handleInsert} />
                </Menu>
              }
              placement="right"
              popover={MENU_POPOVER_PROPS}
            />
          )}

          {!value._key && (
            <Box marginLeft={1}>
              <Tooltip
                content={
                  <Box padding={2}>
                    <Text muted size={1}>
                      This item is missing the required <code>_key</code> property.
                    </Text>
                  </Box>
                }
                placement="top"
              >
                <Badge mode="outline" tone="caution">
                  Missing key
                </Badge>
              </Tooltip>
            </Box>
          )}
        </Flex>
      </Flex>
    </RowWrapper>
  )
})
