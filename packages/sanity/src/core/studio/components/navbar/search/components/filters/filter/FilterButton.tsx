import {CloseIcon} from '@sanity/icons'
import {Button, Flex, Inline, Popover, rem, Text, Theme, useClickOutside} from '@sanity/ui'
import React, {useCallback, useState} from 'react'
import styled, {css} from 'styled-components'
import {useSearchState} from '../../../contexts/search/useSearchState'
import {getOperator} from '../../../definitions/operators'
import type {SearchFilter} from '../../../types'
import {FilterTitle} from '../common/FilterTitle'
import {FilterPopoverContent} from './FilterPopoverContent'
// import {FilterIcon} from './FilterIcon'
import {getFilterValue} from './getFilterValue'

interface FilterButtonProps {
  closable?: boolean
  filter: SearchFilter
  initialOpen?: boolean
}

const CloseButton = styled(Button)`
  border-radius: ${({theme}) =>
    `0 ${rem(theme.sanity.radius[2])} ${rem(theme.sanity.radius[2])} 0`};
`
const LabelButton = styled(Button)(({$joined, theme}: {$joined?: boolean; theme: Theme}) => {
  const radius = rem(theme.sanity.radius[2])
  return css`
    border-radius: ${$joined ? `${radius} 0 0 ${radius}` : radius};
  `
})

export default function FilterButton({closable = true, filter, initialOpen}: FilterButtonProps) {
  const [open, setOpen] = useState(initialOpen)
  const [buttonElement, setButtonElement] = useState<HTMLElement | null>(null)
  const [popoverElement, setPopoverElement] = useState<HTMLElement | null>(null)

  const {
    dispatch,
    state: {definitions},
  } = useSearchState()

  const handleClose = useCallback(() => setOpen(false), [])
  const handleOpen = useCallback(() => setOpen(true), [])
  const handleRemove = useCallback(
    () =>
      dispatch({
        _key: filter._key,
        type: 'TERMS_FILTERS_REMOVE',
      }),
    [dispatch, filter._key]
  )

  useClickOutside(handleClose, [buttonElement, popoverElement])

  const operator = getOperator(definitions.operators, filter.operatorType)
  const value = getFilterValue(filter)
  const hasValue = operator?.inputComponent ? value : true
  const isFilled = filter.operatorType && hasValue

  return (
    <Popover
      content={<FilterPopoverContent filter={filter} onClose={handleClose} />}
      open={open}
      placement="bottom-start"
      portal
      ref={setPopoverElement}
    >
      <Flex ref={setButtonElement}>
        <LabelButton
          $joined={closable}
          fontSize={1}
          onClick={handleOpen}
          padding={2}
          style={{
            maxWidth: '100%', //
          }}
          tone={isFilled ? 'primary' : 'default'}
        >
          <Inline space={1}>
            {/*
            <Box marginRight={1}>
              <Text size={1}>
                <FilterIcon filter={filter} />
              </Text>
            </Box>
            */}
            {/* Title */}
            <Text size={1} weight="medium">
              <FilterTitle filter={filter} />
            </Text>
            {/* Operator */}
            {isFilled && (
              <Text muted size={1} weight="regular">
                {operator?.buttonLabel}
              </Text>
            )}
            {/* Value */}
            {isFilled && (
              <Text size={1} textOverflow="ellipsis" weight="medium">
                {value}
              </Text>
            )}
          </Inline>
        </LabelButton>

        {closable && (
          <CloseButton
            fontSize={1}
            icon={CloseIcon}
            onClick={handleRemove}
            padding={2}
            tone={isFilled ? 'primary' : 'default'}
          />
        )}
      </Flex>
    </Popover>
  )
}
