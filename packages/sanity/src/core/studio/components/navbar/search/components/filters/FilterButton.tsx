import {CloseIcon} from '@sanity/icons'
import {Box, Button, Flex, Inline, Popover, rem, Text, Theme, useClickOutside} from '@sanity/ui'
import {intersection} from 'lodash'
import React, {useCallback, useMemo, useState} from 'react'
import styled, {css} from 'styled-components'
import {FILTERS} from '../../config/filters'
import {OPERATORS} from '../../config/operators'
import {useSearchState} from '../../contexts/search/useSearchState'
import type {KeyedSearchFilter} from '../../types'
import {FilterContent} from './FilterContent'
import {FilterIcon} from './FilterIcon'
import {getFilterValue} from './getFilterValue'

interface FilterButtonProps {
  closable?: boolean
  filter: KeyedSearchFilter
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
    state: {
      terms: {filters, types},
    },
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

  const isValid = useMemo(() => {
    if (filter.type === 'compound') {
      return true
    }
    const intersectingArrays = filters.map((f) => f?.documentTypes || [])
    if (types.length > 0) {
      intersectingArrays.push(types.map((type) => type.name))
    }
    const intersecting = intersection(...intersectingArrays)
    return intersecting.length > 0
  }, [filter.type, filters, types])

  const title = useMemo(() => {
    switch (filter.type) {
      case 'compound':
        return FILTERS.compound[filter.id].title
      case 'field': {
        return filter.path[filter.path.length - 1]
      }
      default:
        return 'Unknown type'
    }
  }, [filter])

  // TODO: refactor, store this in `filters or equivalent
  const supportsValue = useMemo(() => {
    if (filter.type === 'compound') {
      return true
    }
    if (filter.type === 'field') {
      return !['empty', 'notEmpty'].includes(filter?.operatorType || '')
    }
    return true
  }, [filter])

  const operator = filter?.operatorType && OPERATORS[filter.operatorType].buttonLabel
  const value = getFilterValue(filter)

  const isFilled = operator && (supportsValue ? value : true)

  return (
    <Popover
      content={<FilterContent filter={filter} onClose={handleClose} />}
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
            opacity: isFilled ? 1 : 0.8,
          }}
          // tone={filter.type === 'field' ? 'primary' : 'default'}
          tone="primary"
          // tone={isFilled ? 'primary' : 'default'}
        >
          <Inline space={1}>
            <Box marginRight={1}>
              <Text size={1}>
                <FilterIcon filter={filter} />
              </Text>
            </Box>

            <Text size={1} weight="medium">
              {title}
            </Text>
            {/* Operator */}
            {operator && (supportsValue ? value : true) && (
              <Text muted size={1} style={{opacity: 0.9}} weight="regular">
                {operator}
              </Text>
            )}
            {/* Value */}
            {value && (
              <Text size={1} textOverflow="ellipsis">
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
            style={{opacity: isFilled ? 1 : 0.8}}
            // tone={filter.type === 'field' ? 'primary' : 'default'}
            tone="primary"
          />
        )}
      </Flex>
    </Popover>
  )
}
