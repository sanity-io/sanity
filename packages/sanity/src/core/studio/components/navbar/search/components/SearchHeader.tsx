import {CloseIcon, ControlsIcon, SearchIcon, SpinnerIcon} from '@sanity/icons'
import {Box, Button, Card, Flex, studioTheme, Theme} from '@sanity/ui'
import React, {Dispatch, SetStateAction, useCallback, useEffect, useRef, useState} from 'react'
import styled, {keyframes} from 'styled-components'
import {useSearchState} from '../contexts/search/useSearchState'
import {supportsTouch} from '../utils/supportsTouch'
import {CustomTextInput} from './CustomTextInput'

interface SearchHeaderProps {
  onClose?: () => void
  setHeaderInputRef: Dispatch<SetStateAction<HTMLInputElement | null>>
}

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`

const AnimatedSpinnerIcon = styled(SpinnerIcon)`
  animation: ${rotate} 500ms linear infinite;
`

const FilterBox = styled(Box)`
  position: relative;
`

const SearchHeaderCard = styled(Card)`
  flex-shrink: 0;
`

const NotificationBadge = styled.div`
  align-items: center;
  background: ${({theme}: {theme: Theme}) => theme.sanity.color.selectable?.primary.enabled.fg};
  color: ${({theme}: {theme: Theme}) => theme.sanity.color.selectable?.primary.selected.fg};
  border-radius: 100%;
  display: flex;
  font-size: calc(8 / 16 * 1rem);
  font-weight: ${studioTheme.fonts.text.weights.semibold};
  height: 14px;
  justify-content: center;
  pointer-events: none;
  position: absolute;
  right: -2px;
  top: -2px;
  width: 14px;
`

export function SearchHeader({onClose, setHeaderInputRef}: SearchHeaderProps) {
  const [filterButtonElement, setFilterButtonRef] = useState<HTMLButtonElement | null>(null)
  const isMountedRef = useRef(false)

  const {
    dispatch,
    state: {
      filtersVisible,
      result: {loading},
      terms,
    },
  } = useSearchState()

  const handleFiltersToggle = useCallback(() => dispatch({type: 'FILTERS_TOGGLE'}), [dispatch])
  const handleQueryChange = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) =>
      dispatch({type: 'TERMS_QUERY_SET', query: e.currentTarget.value}),
    [dispatch]
  )
  const handleQueryClear = useCallback(() => {
    dispatch({type: 'TERMS_QUERY_SET', query: ''})
  }, [dispatch])

  // Focus filter button (when filters are hidden after initial mount)
  useEffect(() => {
    if (isMountedRef?.current && !filtersVisible && !supportsTouch) {
      filterButtonElement?.focus()
    }
  }, [filterButtonElement, filtersVisible])

  useEffect(() => {
    isMountedRef.current = true
  }, [])

  return (
    <SearchHeaderCard borderBottom>
      <Flex align="center" flex={1}>
        {/* Search field */}
        <Box
          flex={1}
          paddingLeft={onClose ? 2 : 1}
          paddingRight={onClose ? 2 : 0}
          paddingY={onClose ? 2 : 1}
        >
          <CustomTextInput
            autoComplete="off"
            // border={false} // TODO: re-enable when flashing border issue is fixed
            clearButton={!!terms.query}
            fontSize={2}
            icon={loading ? AnimatedSpinnerIcon : SearchIcon}
            onChange={handleQueryChange}
            onClear={handleQueryClear}
            placeholder="Search"
            ref={setHeaderInputRef}
            // smallClearButton
            spellCheck={false}
            value={terms.query}
          />
        </Box>

        {/* Filter toggle */}
        <Card borderLeft={!!onClose} padding={onClose ? 2 : 1}>
          <FilterBox>
            <Button
              aria-expanded={filtersVisible}
              aria-label="Filter"
              height="fill"
              icon={ControlsIcon}
              mode="bleed"
              onClick={handleFiltersToggle}
              padding={3}
              ref={setFilterButtonRef}
              selected={filtersVisible}
              tone="default"
            />
            {terms.types.length > 0 && <NotificationBadge>{terms.types.length}</NotificationBadge>}
          </FilterBox>
        </Card>

        {/* (Fullscreen) Close button */}
        {onClose && (
          <Card borderLeft padding={2}>
            <Button aria-label="Close search" icon={CloseIcon} mode="bleed" onClick={onClose} />
          </Card>
        )}
      </Flex>
    </SearchHeaderCard>
  )
}
