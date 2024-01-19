import {CloseIcon} from '@sanity/icons'
import {
  // eslint-disable-next-line no-restricted-imports
  Button, // Button with specific styling and children behavior.
  Card,
  rem,
  useClickOutside,
} from '@sanity/ui'
import React, {KeyboardEvent, useCallback, useState} from 'react'
import styled from 'styled-components'
import {Popover} from '../../../../../../../../ui-components'
import {POPOVER_RADIUS, POPOVER_VERTICAL_MARGIN} from '../../../constants'
import {useSearchState} from '../../../contexts/search/useSearchState'
import type {SearchFilter} from '../../../types'
import {getFilterKey, validateFilter} from '../../../utils/filterUtils'
import {FilterLabel} from '../../common/FilterLabel'
import {FilterPopoverWrapper} from '../common/FilterPopoverWrapper'
import {useTranslation} from '../../../../../../../i18n'
import {FilterPopoverContent} from './FilterPopoverContent'

interface FilterButtonProps {
  filter: SearchFilter
  initialOpen?: boolean
}

const CloseButton = styled(Button)`
  border-radius: ${({theme}) =>
    `0 ${rem(theme.sanity.radius[2])} ${rem(theme.sanity.radius[2])} 0`};
`

const CloseCard = styled(Card)`
  position: absolute;
  right: 0;
`

const ContainerDiv = styled.div`
  align-items: center;
  display: inline-flex;
  max-width: 100%;
  position: relative;
`

const LabelButton = styled(Button)`
  border: none;
  width: 100%;
`

export function FilterButton({filter, initialOpen}: FilterButtonProps) {
  const [open, setOpen] = useState(initialOpen)
  const [buttonElement, setButtonElement] = useState<HTMLElement | null>(null)
  const [popoverElement, setPopoverElement] = useState<HTMLElement | null>(null)

  const {
    dispatch,
    state: {definitions, fullscreen},
  } = useSearchState()

  const {t} = useTranslation()

  const handleClose = useCallback(() => setOpen(false), [])
  const handleOpen = useCallback(() => setOpen(true), [])
  const handleRemove = useCallback(
    () =>
      dispatch({
        filterKey: getFilterKey(filter),
        type: 'TERMS_FILTERS_REMOVE',
      }),
    [dispatch, filter],
  )
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      if (['Backspace', 'Delete'].includes(event.key)) {
        handleRemove()
      }
    },
    [handleRemove],
  )

  useClickOutside(handleClose, [buttonElement, popoverElement])

  const isValid = validateFilter({
    fieldDefinitions: definitions.fields,
    filter,
    filterDefinitions: definitions.filters,
    operatorDefinitions: definitions.operators,
  })

  return (
    <Popover
      __unstable_margins={[POPOVER_VERTICAL_MARGIN, 0, 0, 0]}
      content={
        <FilterPopoverWrapper anchorElement={buttonElement} onClose={handleClose}>
          <FilterPopoverContent filter={filter} />
        </FilterPopoverWrapper>
      }
      constrainSize
      open={open}
      overflow="auto"
      placement="bottom-start"
      portal
      radius={POPOVER_RADIUS}
      ref={setPopoverElement}
    >
      <ContainerDiv>
        <Card
          __unstable_focusRing
          display="flex"
          radius={2}
          tone={isValid ? 'primary' : 'transparent'}
        >
          <LabelButton
            mode="bleed"
            onClick={handleOpen}
            onKeyDown={handleKeyDown}
            paddingLeft={fullscreen ? 3 : 2}
            paddingRight={fullscreen ? 3 : 5}
            paddingY={fullscreen ? 3 : 2}
            ref={setButtonElement}
          >
            <FilterLabel filter={filter} showContent={isValid} />
          </LabelButton>
        </Card>

        {!fullscreen && (
          <CloseCard
            __unstable_focusRing
            display="flex"
            radius={2}
            tone={isValid ? 'primary' : 'transparent'}
          >
            <CloseButton
              aria-label={t('search.action.remove-filter-aria-label')}
              fontSize={1}
              icon={CloseIcon}
              mode="bleed"
              onClick={handleRemove}
              onKeyDown={handleKeyDown}
              padding={2}
              radius={2}
            />
          </CloseCard>
        )}
      </ContainerDiv>
    </Popover>
  )
}
