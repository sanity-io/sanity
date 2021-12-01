import {
  CopyIcon as DuplicateIcon,
  EllipsisVerticalIcon,
  InsertAboveIcon,
  InsertBelowIcon,
  TrashIcon,
  WarningOutlineIcon,
} from '@sanity/icons'
/* eslint-disable no-nested-ternary */
import {FieldPresence} from '@sanity/base/presence'
import React from 'react'
import {
  Badge,
  Box,
  Button,
  Card,
  Flex,
  Menu,
  MenuButton,
  MenuGroup,
  MenuItem,
  Text,
  Tooltip,
} from '@sanity/ui'
import {FormFieldValidationStatus} from '@sanity/base/components'
import styled from 'styled-components'
import {SchemaType} from '@sanity/types'
import {useId} from '@reach/auto-id'
import Preview from '../../../../Preview'
import {DragHandle} from '../../common/DragHandle'
import randomKey from '../../common/randomKey'
import {createProtoValue} from '../ArrayInput'
import {ItemWithMissingType} from './ItemWithMissingType'
import {ItemLayoutProps} from './ItemLayoutProps'

const dragHandle = <DragHandle grid paddingX={2} />

const Root = styled(Card)`
  transition: border-color 250ms;

  &[aria-selected='true'] {
    --card-border-color: var(--card-focus-ring-color);
  }
`

const POSITIONS = ['before', 'after'] as const
const MENU_POPOVER_PROPS = {portal: true, tone: 'default'} as const

export const CellItem = React.forwardRef(function ItemCell(
  props: ItemLayoutProps,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  const focusRef = React.useRef()
  const {
    isSortable,
    value,
    onClick,
    onKeyPress,
    onFocus,
    onInsert,
    insertableTypes,
    type,
    readOnly,
    presence,
    onRemove,
    validation,
    ...rest
  } = props

  const handleDuplicate = () => {
    const key = randomKey()
    onInsert({
      item: {...value, _key: key},
      position: 'after',
      path: [{_key: value._key}],
      edit: false,
    })
  }

  const handleInsert = (pos: 'before' | 'after', insertType: SchemaType) => {
    const key = randomKey()
    onInsert({
      item: {...createProtoValue(insertType), _key: key},
      position: pos,
      path: [{_key: value._key}],
    })
  }

  const id = useId()

  return (
    <Root {...rest} radius={1} padding={1} ref={ref} border>
      {/* Preview */}
      {type ? (
        <Card
          as="button"
          type="button"
          radius={2}
          flex={1}
          tabIndex={0}
          onClick={onClick}
          ref={focusRef}
          onKeyPress={onKeyPress}
          onFocus={onFocus}
          __unstable_focusRing
        >
          <Preview layout="media" value={value} type={type} />
        </Card>
      ) : (
        <Box flex={1}>
          <ItemWithMissingType value={value} onFocus={onFocus} />
        </Box>
      )}

      {/* Presence */}
      {!readOnly && (
        <Box marginTop={3} marginRight={3} style={{position: 'absolute', top: 0, right: 0}}>
          <FieldPresence presence={presence} maxAvatars={1} />
        </Box>
      )}

      {/* Footer */}
      <Flex marginTop={1}>
        {/* Drag handle */}
        <Box flex={1}>{(!readOnly && isSortable && dragHandle) || ' '}</Box>

        {/* Validation status */}
        {value._key && validation.length > 0 && (
          <Box marginLeft={1} paddingX={1} paddingY={3}>
            <FormFieldValidationStatus
              __unstable_markers={validation}
              placement="bottom"
              __unstable_showSummary={!value._ref}
            />
          </Box>
        )}

        {/* Badge: missing key */}
        {!value._key && (
          <Tooltip
            content={
              <Card padding={2}>
                <Text size={1}>
                  This item is missing a required <code>_key</code> property.
                </Text>
              </Card>
            }
          >
            <Badge mode="outline" tone="caution" margin={1} padding={2} fontSize={1}>
              <WarningOutlineIcon /> key
            </Badge>
          </Tooltip>
        )}

        {/* Menu */}
        <Box>
          <MenuButton
            button={<Button padding={2} mode="bleed" icon={EllipsisVerticalIcon} />}
            id={`${id}-menuButton`}
            menu={
              <Menu>
                {!readOnly && (
                  <>
                    <MenuItem text="Remove" tone="critical" icon={TrashIcon} onClick={onRemove} />
                    <MenuItem text="Duplicate" icon={DuplicateIcon} onClick={handleDuplicate} />
                    {POSITIONS.map((pos) => {
                      const icon = pos === 'before' ? InsertAboveIcon : InsertBelowIcon
                      const text = `Add item ${pos}`
                      if (insertableTypes.length === 1) {
                        return (
                          <MenuItem
                            key={pos}
                            text={text}
                            icon={icon}
                            onClick={() => handleInsert(pos, insertableTypes[0])}
                          />
                        )
                      }
                      return (
                        <MenuGroup
                          text={text}
                          key={pos}
                          popover={{...MENU_POPOVER_PROPS, placement: 'left'}}
                        >
                          {insertableTypes.map((insertableType) => (
                            <MenuItem
                              key={insertableType.name}
                              icon={insertableType.icon}
                              text={insertableType.title}
                              onClick={() => handleInsert(pos, insertableType)}
                            />
                          ))}
                        </MenuGroup>
                      )
                    })}
                  </>
                )}
              </Menu>
            }
          />
        </Box>
      </Flex>
    </Root>
  )
})
