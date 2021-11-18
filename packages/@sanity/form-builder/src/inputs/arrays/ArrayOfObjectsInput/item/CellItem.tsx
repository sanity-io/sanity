import {WarningOutlineIcon} from '@sanity/icons'
import {FieldPresence} from '@sanity/base/presence'
import React from 'react'
import {Badge, Box, Card, Flex, Text, Tooltip} from '@sanity/ui'
import {FormFieldValidationStatus} from '@sanity/base/components'
import styled from 'styled-components'
import Preview from '../../../../Preview'
import {ConfirmDeleteButton} from '../ConfirmDeleteButton'
import {DragHandle} from '../../common/DragHandle'
import {ItemWithMissingType} from './ItemWithMissingType'
import {ItemLayoutProps} from './ItemLayoutProps'

const dragHandle = <DragHandle grid paddingX={2} />

const Root = styled(Card)`
  transition: border-color 250ms;

  &[aria-selected='true'] {
    --card-border-color: var(--card-focus-ring-color);
  }
`

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
    type,
    readOnly,
    presence,
    onRemove,
    validation,
    ...rest
  } = props

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

        {/* Delete button */}
        <Box>
          <ConfirmDeleteButton
            disabled={readOnly || !onRemove}
            onConfirm={onRemove}
            placement="bottom"
            title="Remove item"
          />
        </Box>
      </Flex>
    </Root>
  )
})
