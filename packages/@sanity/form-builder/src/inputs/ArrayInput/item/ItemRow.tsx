import {LinkIcon, WarningOutlineIcon} from '@sanity/icons'
import {FieldPresence} from '@sanity/base/presence'
import ValidationStatus from 'part:@sanity/components/validation/status'
import React from 'react'
import {Badge, Box, Card, Flex, Tooltip, Text} from '@sanity/ui'
import Preview from '../../../Preview'
import {ConfirmDeleteButton} from '../ConfirmDeleteButton'
import {IntentButton} from '../../../components/IntentButton'

import {DragHandle} from './DragHandle'
import {ItemWithMissingType} from './ItemWithMissingType'
import {ItemLayoutProps} from './ItemLayoutProps'

const dragHandle = <DragHandle />

export const ItemRow = React.forwardRef(function RegularItem(
  props: ItemLayoutProps,
  ref: React.ForwardedRef<HTMLElement>
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
  } = props

  return (
    <Card radius={2} shadow={1} padding={1} ref={ref}>
      <Flex align="center">
        {isSortable && <Box marginRight={1}>{dragHandle}</Box>}

        {type ? (
          <Card
            as="button"
            radius={2}
            padding={1}
            flex={1}
            tabIndex={0}
            onClick={onClick}
            ref={focusRef}
            onKeyPress={onKeyPress}
            onFocus={onFocus}
          >
            <Preview layout="default" value={value} type={type} />
          </Card>
        ) : (
          <Box flex={1}>
            <ItemWithMissingType value={value} onFocus={onFocus} />
          </Box>
        )}

        <Flex>
          {!readOnly && presence.length > 0 && (
            <Box marginLeft={1}>
              <FieldPresence presence={presence} maxAvatars={1} />
            </Box>
          )}

          {!readOnly && (
            <Box marginLeft={1}>
              <ValidationStatus markers={validation} showSummary={!value._ref} />
            </Box>
          )}

          {value._ref && (
            <Box marginLeft={1}>
              <IntentButton icon={LinkIcon} intent="edit" mode="bleed" params={{id: value._ref}} />
            </Box>
          )}

          {!readOnly && onRemove && (
            <Box marginLeft={1}>
              <ConfirmDeleteButton placement="left" title="Remove item" onConfirm={onRemove} />
            </Box>
          )}
          {!value._key && (
            <Box marginLeft={1}>
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
                  <WarningOutlineIcon /> Missing key
                </Badge>
              </Tooltip>
            </Box>
          )}
        </Flex>
      </Flex>
    </Card>
  )
})
