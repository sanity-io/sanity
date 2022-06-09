import {
  CopyIcon as DuplicateIcon,
  EllipsisVerticalIcon,
  TrashIcon,
  WarningOutlineIcon,
} from '@sanity/icons'
import React, {useCallback, useMemo} from 'react'
import {Badge, Box, Button, Card, Flex, Menu, MenuButton, MenuItem, Text, Tooltip} from '@sanity/ui'
import styled from 'styled-components'
import {useId} from '@reach/auto-id'
import {SchemaType} from '@sanity/types'
import {FormFieldValidationStatus} from '../../../../components/formField'
import {FieldPresence} from '../../../../../presence'
import {DragHandle} from '../../common/DragHandle'
import {randomKey} from '../../common/randomKey'
import {createProtoValue} from '../ArrayInput'
import {InsertMenu} from '../InsertMenu'
import {FIXME} from '../../../../types'
import {EMPTY_ARRAY} from '../../../../utils/empty'
import {ItemWithMissingType} from './ItemWithMissingType'
import {ItemLayoutProps} from './ItemLayoutProps'

const dragHandle = <DragHandle grid padding={2} mode="ghost" />

const DragHandleCard = styled(Card)`
  position: absolute;
  top: 0;
  left: 0;
`
const PresenceFlex = styled(Flex)`
  position: absolute;
  top: 0;
  right: 0;
  height: 35px;
`

const Root = styled(Card)`
  transition: border-color 250ms;
  position: relative;

  @media (hover: hover) {
    ${DragHandleCard} {
      opacity: 0;
    }

    &:hover,
    &:focus-within {
      ${DragHandleCard} {
        opacity: 1;
      }
    }
  }

  &[aria-selected='true'] {
    box-shadow: 0 0 0 2px var(--card-focus-ring-color);
  }
`

const FooterFlex = styled(Flex)`
  min-height: 35px;
`

const PreviewCard = styled(Card)`
  border-top-right-radius: inherit;
  border-top-left-radius: inherit;
  height: 100%;

  @media (hover: hover) {
    &:hover {
      filter: brightness(95%);
    }
  }

  &:focus:focus-visible {
    box-shadow: 0 0 0 2px var(--card-focus-ring-color);
  }
`
const MissingTypeBox = styled(Box)`
  padding-bottom: 100%;
`

const StyledItemWithMissingType = styled(ItemWithMissingType)`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
`

export const CellItem = React.forwardRef(function ItemCell(
  props: ItemLayoutProps,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  const focusRef = React.useRef<HTMLDivElement | null>(null)
  const {
    isSortable,
    value,
    onClick,
    onFocus,
    onInsert,
    insertableTypes,
    type,
    readOnly,
    presence,
    onRemove,
    renderPreview,
    validation = EMPTY_ARRAY,
    ...rest
  } = props

  const hasError = validation.filter((item) => item.level === 'error').length > 0
  const hasWarning = validation.filter((item) => item.level === 'warning').length > 0

  const tone = useMemo(() => {
    if (!value._key) {
      return 'caution'
    }

    if (hasError) {
      return 'critical'
    }
    if (hasWarning) {
      return 'caution'
    }

    return undefined
  }, [hasError, hasWarning, value._key])

  const handleDuplicate = useCallback(() => {
    onInsert?.({
      items: [{...value, _key: randomKey()}],
      position: 'after',
    })
  }, [onInsert, value])

  const handleInsert = useCallback(
    (pos: 'before' | 'after', insertType: SchemaType) => {
      onInsert?.({
        items: [createProtoValue(insertType)],
        position: pos,
      })
    },
    [onInsert, value._key]
  )

  const id = useId()

  return (
    <Root {...rest} radius={2} ref={ref} border tone={tone}>
      {/* Preview */}
      {type ? (
        <PreviewCard
          tone="inherit"
          data-ui="PreviewCard"
          forwardedAs={'button' as FIXME}
          type="button"
          overflow="auto"
          flex={1}
          tabIndex={0}
          onClick={onClick}
          ref={focusRef}
          onFocus={onFocus}
          __unstable_focusRing
        >
          {renderPreview({
            layout: 'media',
            schemaType: type,
            value,
            withBorder: false,
            withRadius: false,
          })}
        </PreviewCard>
      ) : (
        <MissingTypeBox flex={1}>
          <StyledItemWithMissingType value={value} onFocus={onFocus} vertical />
        </MissingTypeBox>
      )}

      <DragHandleCard margin={1} radius={2} display="flex" tone="inherit" data-ui="DragHandleCard">
        {!readOnly && isSortable && dragHandle}
      </DragHandleCard>

      <PresenceFlex align="center" marginX={1}>
        {!readOnly && <FieldPresence presence={presence} maxAvatars={1} />}
      </PresenceFlex>

      {/* Footer */}
      <FooterFlex align="center" paddingX={1} sizing="border" justify="space-between">
        <Flex>
          {/* Validation status */}
          {value?._key && validation.length > 0 && (
            <Box marginLeft={1} paddingX={1} paddingY={3}>
              <FormFieldValidationStatus
                validation={validation}
                __unstable_showSummary={!value?._ref}
                placement="bottom"
                portal
              />
            </Box>
          )}

          {/* Badge: missing key */}
          {!value._key && (
            <Tooltip
              portal
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
        </Flex>
        {/* Menu */}
        {!readOnly && (
          <Box>
            <MenuButton
              button={<Button padding={2} mode="bleed" icon={EllipsisVerticalIcon} />}
              id={`${id}-menuButton`}
              portal
              menu={
                <Menu>
                  <MenuItem text="Remove" tone="critical" icon={TrashIcon} onClick={onRemove} />
                  <MenuItem text="Duplicate" icon={DuplicateIcon} onClick={handleDuplicate} />
                  <InsertMenu types={insertableTypes} onInsert={handleInsert} />
                </Menu>
              }
            />
          </Box>
        )}
      </FooterFlex>
    </Root>
  )
})
