/* eslint-disable no-nested-ternary */
import {FieldPresence} from '@sanity/base/presence'
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
import {FormFieldValidationStatus} from '@sanity/base/components'
import {useId} from '@reach/auto-id'
import {SchemaType} from '@sanity/types'
import Preview from '../../../../Preview'

import {DragHandle} from '../../common/DragHandle'
import randomKey from '../../common/randomKey'
import {createProtoValue} from '../ArrayInput'
import {InsertMenu} from '../InsertMenu'
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
    onKeyPress,
    onFocus,
    type,
    readOnly,
    presence,
    onInsert,
    insertableTypes,
    onRemove,
    validation,
    ...rest
  } = props

  const hasErrors = validation.some((v) => v.level === 'error')
  const hasWarnings = validation.some((v) => v.level === 'warning')

  const handleDuplicate = useCallback(() => {
    onInsert?.({
      item: {...value, _key: randomKey()},
      position: 'after',
      path: [{_key: value._key}],
      edit: false,
    })
  }, [onInsert, value])

  const handleInsert = useCallback(
    (pos: 'before' | 'after', insertType: SchemaType) => {
      onInsert?.({
        item: {...createProtoValue(insertType), _key: randomKey()},
        position: pos,
        path: [{_key: value._key}],
      })
    },
    [onInsert, value._key]
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
            onKeyPress={onKeyPress}
            onFocus={onFocus}
            __unstable_focusRing
          >
            <Preview
              layout={type.options?.layout === 'grid' ? 'media' : 'default'}
              value={value}
              type={type}
            />
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
              <FormFieldValidationStatus
                __unstable_markers={validation}
                __unstable_showSummary={!value._ref}
              />
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
                    <Text size={1}>
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
