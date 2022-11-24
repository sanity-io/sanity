import {CloseIcon} from '@sanity/icons'
import {Box, Button, Card, Popover, rem, Stack, Text, useClickOutside} from '@sanity/ui'
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

const CustomButton = styled(Button)`
  width: 100%;
`

const ContainerDiv = styled.div`
  align-items: center;
  display: inline-flex;
  max-width: 100%;
  position: relative;
`

export function FilterButton({filter, initialOpen}: FilterButtonProps) {
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

  const isComplete = isFilterComplete(filter, definitions.fields, definitions.operators)

  return (
    <Popover
      content={
        <FilterPopoverWrapper onClose={handleClose}>
          <FilterPopoverContent filter={filter} />
        </FilterPopoverWrapper>
      }
      constrainSize
      open={open}
      overflow="auto"
      placement="bottom-start"
      portal
      ref={setPopoverElement}
    >
      <ContainerDiv ref={setButtonElement}>
        <CustomButton
          onClick={handleOpen}
          onKeyDown={handleKeyDown}
          paddingLeft={fullscreen ? 3 : 2}
          paddingRight={fullscreen ? 3 : 5}
          paddingY={fullscreen ? 3 : 2}
          radius={2}
          tone={isComplete ? 'primary' : 'default'}
        >
          <FilterLabel filter={filter} showContent={isComplete} />
        </CustomButton>

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
      </ContainerDiv>
    </Popover>
  )
}
