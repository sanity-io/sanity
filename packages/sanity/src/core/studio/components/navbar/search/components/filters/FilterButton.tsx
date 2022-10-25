import {CloseIcon} from '@sanity/icons'
import {Button, Flex, Popover, rem, Text, Theme} from '@sanity/ui'
import React, {useCallback, useState} from 'react'
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

  const {dispatch} = useSearchState()

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

  return (
    <Popover
      // arrow={false}
      content={<FilterContent filter={filter} onClose={handleClose} />}
      open={open}
      placement="bottom-start"
      portal
    >
      <Flex>
        <LabelButton
          $joined={closable}
          fontSize={1}
          onClick={handleOpen}
          padding={2}
          style={{maxWidth: '100%'}}
          tone={filter.type === 'field' ? 'primary' : 'default'}
        >
          <Text size={1} textOverflow="ellipsis">
            <>
              {/* Field name */}
              <span style={{fontWeight: 500}}>
                {filter.type === 'compound' && FILTERS.compound[filter.id].title}
                {filter.type === 'custom' && filter.title}
                {filter.type === 'field' && filter.path[filter.path.length - 1]}:
              </span>

              {/* Value */}
              <FilterButtonValue filter={filter} />
            </>
          </Text>
        </LabelButton>

        {closable && (
          <CloseButton
            fontSize={1}
            icon={CloseIcon}
            onClick={handleRemove}
            padding={2}
            tone={filter.type === 'field' ? 'primary' : 'default'}
          />
        )}
      </Flex>
    </Popover>
  )
}
