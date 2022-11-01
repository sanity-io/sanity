import {CloseIcon, WarningOutlineIcon} from '@sanity/icons'
import {Button, Flex, Popover, rem, Text, Theme, useClickOutside} from '@sanity/ui'
import {intersection} from 'lodash'
import React, {useCallback, useMemo, useState} from 'react'
import styled, {css} from 'styled-components'
import {FILTERS} from '../../config/filters'
import {useSearchState} from '../../contexts/search/useSearchState'
import type {KeyedSearchFilter} from '../../types'
import {FilterButtonValue} from './FilterButtonValue'
import {FilterContent} from './FilterContent'

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
        const prefix = filter.path.length > 1 ? '... / ' : ''
        return prefix + filter.path[filter.path.length - 1]
      }
      default:
        return 'Unknown type'
    }
  }, [filter])

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
          style={{maxWidth: '100%'}}
          tone={isValid ? 'primary' : 'caution'}
        >
          <Flex align="center" gap={3}>
            {!isValid && (
              <Text size={1}>
                <WarningOutlineIcon />
              </Text>
            )}
            <Text size={1} textOverflow="ellipsis">
              {/* Field name */}
              <span style={{fontWeight: 500}}>{title}:</span>
              {/* Value */}
              <FilterButtonValue filter={filter} />
            </Text>
          </Flex>
        </LabelButton>

        {closable && (
          <CloseButton
            fontSize={1}
            icon={CloseIcon}
            onClick={handleRemove}
            padding={2}
            tone={isValid ? 'primary' : 'caution'}
          />
        )}
      </Flex>
    </Popover>
  )
}
