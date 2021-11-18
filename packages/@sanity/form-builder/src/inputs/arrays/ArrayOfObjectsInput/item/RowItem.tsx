import {FieldPresence} from '@sanity/base/presence'
import React from 'react'
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
import {EllipsisVerticalIcon, TrashIcon} from '@sanity/icons'
import {FormFieldValidationStatus} from '@sanity/base/components'
import {useId} from '@reach/auto-id'
import Preview from '../../../../Preview'

import {DragHandle} from '../../common/DragHandle'
import {ItemWithMissingType} from './ItemWithMissingType'
import {ItemLayoutProps} from './ItemLayoutProps'
import {RowWrapper} from './components/RowWrapper'

const dragHandle = <DragHandle paddingX={1} paddingY={3} />

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
    onRemove,
    validation,
    ...rest
  } = props

  const hasErrors = validation.some((v) => v.level === 'error')
  const hasWarnings = validation.some((v) => v.level === 'warning')

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
          <MenuButton
            button={<Button padding={2} mode="bleed" icon={EllipsisVerticalIcon} />}
            id={`${id}-menuButton`}
            menu={
              <Menu>
                {!readOnly && (
                  <>
                    <MenuItem text="Remove" tone="critical" icon={TrashIcon} onClick={onRemove} />
                  </>
                )}
              </Menu>
            }
            placement="right"
            popover={{portal: true, tone: 'default'}}
          />
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
