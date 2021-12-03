import {WarningOutlineIcon} from '@sanity/icons'
import {FieldPresence} from '@sanity/base/presence'
import React, {useMemo} from 'react'
import {Badge, Box, Card, Flex, Text, Tooltip} from '@sanity/ui'
import {FormFieldValidationStatus} from '@sanity/base/components'
import styled from 'styled-components'
import {isValidationWarningMarker, isValidationErrorMarker} from '@sanity/types'
import Preview from '../../../../Preview'
import {ConfirmDeleteButton} from '../ConfirmDeleteButton'
import {DragHandle} from '../../common/DragHandle'
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

  const hasError = validation.filter(isValidationErrorMarker).length > 0
  const hasWarning = validation.filter(isValidationWarningMarker).length > 0
  const hasKey = value._key

  const tone = useMemo(() => {
    if (!hasKey) {
      return 'caution'
    }

    if (hasError) {
      return 'critical'
    }
    if (hasWarning) {
      return 'caution'
    }

    return undefined
  }, [hasError, hasWarning, hasKey])

  return (
    <Root {...rest} radius={2} ref={ref} border tone={tone}>
      {/* Preview */}
      {type ? (
        <PreviewCard
          tone="inherit"
          data-ui="PreviewCard"
          forwardedAs="button"
          type="button"
          overflow="auto"
          flex={1}
          tabIndex={0}
          onClick={onClick}
          ref={focusRef}
          onKeyPress={onKeyPress}
          onFocus={onFocus}
          __unstable_focusRing
        >
          <Preview layout="media" value={value} type={type} withRadius={false} withBorder={false} />
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
          {value._key && validation.length > 0 && (
            <Box marginLeft={1} paddingX={1} paddingY={3}>
              <FormFieldValidationStatus
                __unstable_markers={validation}
                __unstable_showSummary={!value._ref}
                placement="bottom"
                portal
              />
            </Box>
          )}

          {/* Badge: missing key */}
          {!hasKey && (
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

        {/* Delete button */}
        <Box>
          <ConfirmDeleteButton
            disabled={readOnly || !onRemove}
            onConfirm={onRemove}
            placement="bottom"
            title="Remove item"
          />
        </Box>
      </FooterFlex>
    </Root>
  )
})
