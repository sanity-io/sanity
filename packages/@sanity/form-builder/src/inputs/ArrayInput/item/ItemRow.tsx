import {LinkIcon} from '@sanity/icons'
import {FieldPresence} from '@sanity/base/presence'
import ValidationStatus from 'part:@sanity/components/validation/status'
import React from 'react'
import {Badge, Box, Card, Flex} from '@sanity/ui'
import Preview from '../../../Preview'
import {ConfirmDeleteButton} from '../ConfirmDeleteButton'
import {IntentButton} from '../../../components/IntentButton'

import {DragHandle} from './DragHandle'
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
        <Card
          as="button"
          radius={2}
          flex={1}
          tabIndex={0}
          onClick={onClick}
          ref={focusRef}
          onKeyPress={onKeyPress}
          onFocus={onFocus}
        >
          {type && <Preview layout="default" value={value} type={type} />}
        </Card>

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
              <Badge mode="outline" tone="caution" padding={2} fontSize={1}>
                Missing key
              </Badge>
            </Box>
          )}
        </Flex>
      </Flex>
    </Card>
  )
})
