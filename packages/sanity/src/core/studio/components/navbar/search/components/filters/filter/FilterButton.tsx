import {CloseIcon} from '@sanity/icons'
import {Button, Flex, Popover, rem, useClickOutside} from '@sanity/ui'
import React, {KeyboardEvent, useCallback, useState} from 'react'
import styled from 'styled-components'
import {useSearchState} from '../../../contexts/search/useSearchState'
import {getOperator} from '../../../definitions/operators'
import type {SearchFilter} from '../../../types'
import {getFilterKey} from '../../../utils/filterUtils'
import {FilterLabel} from '../../common/FilterLabel'
import {FilterPopoverContent} from './FilterPopoverContent'

interface FilterButtonProps {
  filter: SearchFilter
  initialOpen?: boolean
}

const CloseButton = styled(Button)`
  border-radius: ${({theme}) =>
    `0 ${rem(theme.sanity.radius[2])} ${rem(theme.sanity.radius[2])} 0`};
`

export default function FilterButton({filter, initialOpen}: FilterButtonProps) {
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
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      if (['Backspace', 'Delete'].includes(event.key)) {
        handleRemove()
      }
    },
    [handleRemove]
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
      constrainSize
      open={open}
      placement="bottom-start"
      portal
      ref={setPopoverElement}
    >
      <Flex align="center" ref={setButtonElement} style={{position: 'relative'}}>
        <Button
          fontSize={1}
          onClick={handleOpen}
          onKeyDown={handleKeyDown}
          paddingLeft={2}
          paddingRight={5}
          paddingY={2}
          radius={2}
          style={{maxWidth: '100%'}}
          tone={isFilled ? 'primary' : 'default'}
        >
          <FilterLabel filter={filter} showContent={isFilled} />
        </Button>

        <CloseButton
          fontSize={1}
          icon={CloseIcon}
          onClick={handleRemove}
          onKeyDown={handleKeyDown}
          padding={2}
          style={{
            position: 'absolute',
            right: 0,
          }}
          tone={isFilled ? 'primary' : 'default'}
        />
      </Flex>
    </Popover>
  )
}
