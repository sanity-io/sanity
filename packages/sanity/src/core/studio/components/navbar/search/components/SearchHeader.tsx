import {CloseIcon, ControlsIcon, SearchIcon, SpinnerIcon} from '@sanity/icons'
import {Box, Button, Card, Flex, Theme} from '@sanity/ui'
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
  background: ${({theme}: {theme: Theme}) => theme.sanity.color.selectable?.primary.enabled.fg};
  border-radius: 100%;
  height: 6px;
  position: absolute;
  right: 2px;
  top: 2px;
  width: 6px;
`

export function SearchHeader({onClose, setHeaderInputRef}: SearchHeaderProps) {
  const [filterButtonElement, setFilterButtonRef] = useState<HTMLButtonElement | null>(null)
  const isMountedRef = useRef(false)

  const {
    dispatch,
    state: {
      filters,
      filtersVisible,
      result: {loading},
      terms: {types, query},
    },
  } = useSearchState()

  const handleFiltersToggle = useCallback(
    () => dispatch({type: 'FILTERS_VISIBLE_SET', visible: !filtersVisible}),
    [dispatch, filtersVisible]
  )
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

  const notificationBadgeVisible = filters.length > 0 || types.length > 0

  return (
    <SearchHeaderCard
    // borderBottom
    >
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
            border={false}
            clearButton={!!query}
            fontSize={2}
            icon={loading ? AnimatedSpinnerIcon : SearchIcon}
            onChange={handleQueryChange}
            onClear={handleQueryClear}
            placeholder="Search"
            ref={setHeaderInputRef}
            spellCheck={false}
            value={query}
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
            {notificationBadgeVisible && <NotificationBadge />}
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
