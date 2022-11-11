import {CloseIcon} from '@sanity/icons'
import {Button, Flex, Popover, rem, Theme, useClickOutside} from '@sanity/ui'
import React, {useCallback, useState} from 'react'
import styled, {css} from 'styled-components'
import {useSearchState} from '../../../contexts/search/useSearchState'
import {getOperator} from '../../../definitions/operators'
import type {SearchFilter} from '../../../types'
import {getFilterKey} from '../../../utils/filterUtils'
import {FilterLabel} from '../../common/FilterLabel'
import {FilterPopoverContent} from './FilterPopoverContent'

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
        filterKey: getFilterKey(filter),
        type: 'TERMS_FILTERS_REMOVE',
      }),
    [dispatch, filter]
  )

  useClickOutside(handleClose, [buttonElement, popoverElement])

  const operator = getOperator(definitions.operators, filter.operatorType)
  const value = operator?.buttonValue && operator.buttonValue(filter.value)
  const hasValue = value !== undefined && value !== null
  // Mark as 'filled' if both operator and value are present (or no input component is defined).
  const isFilled = operator?.inputComponent ? !!(filter.operatorType && hasValue) : true

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
          <FilterLabel filter={filter} showContent={isFilled} />
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
