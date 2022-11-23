import {CloseIcon} from '@sanity/icons'
import {Button, Flex, Popover, rem, useClickOutside} from '@sanity/ui'
import React, {KeyboardEvent, useCallback, useState} from 'react'
import styled from 'styled-components'
import {useSearchState} from '../../../contexts/search/useSearchState'
import type {SearchFilter} from '../../../types'
import {getFilterKey, isFilterComplete} from '../../../utils/filterUtils'
import {FilterLabel} from '../../common/FilterLabel'
import {FilterPopoverWrapper} from '../common/FilterPopoverWrapper'
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
    state: {definitions, fullscreen},
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

  const isComplete = isFilterComplete(filter, definitions.operators)

  return (
    <Popover
      content={
        <FilterPopoverWrapper anchorElement={buttonElement} onClose={handleClose}>
          <FilterPopoverContent filter={filter} />
        </FilterPopoverWrapper>
      }
      constrainSize
      open={open}
      placement="bottom-start"
      portal
      ref={setPopoverElement}
    >
      <Flex align="center" ref={setButtonElement} style={{position: 'relative'}}>
        <Button
          onClick={handleOpen}
          onKeyDown={handleKeyDown}
          paddingLeft={fullscreen ? 3 : 2}
          paddingRight={fullscreen ? 3 : 5}
          paddingY={fullscreen ? 3 : 2}
          radius={2}
          style={{maxWidth: '100%'}}
          tone={isComplete ? 'primary' : 'default'}
        >
          <FilterLabel filter={filter} showContent={isComplete} />
        </Button>

        {!fullscreen && (
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
            tone={isComplete ? 'primary' : 'default'}
          />
        )}
      </Flex>
    </Popover>
  )
}
