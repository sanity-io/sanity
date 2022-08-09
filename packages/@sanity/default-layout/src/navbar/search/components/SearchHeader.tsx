import {hues, white} from '@sanity/color'
import {CloseIcon, ControlsIcon, SearchIcon} from '@sanity/icons'
import {Box, Button, Card, Flex, Spinner, studioTheme} from '@sanity/ui'
import React, {RefObject, useCallback, useEffect, useRef} from 'react'
import styled from 'styled-components'
import {useSearchState} from '../contexts/search'
import {CustomTextInput} from './CustomTextInput'

interface SearchHeaderProps {
  inputRef: RefObject<HTMLInputElement>
  onClose?: () => void
}

export function SearchHeader({inputRef, onClose}: SearchHeaderProps) {
  const filterCloseButton = useRef<HTMLButtonElement>()
  const isMounted = useRef(false)

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
    if (isMounted?.current && !filtersVisible) {
      filterCloseButton.current?.focus()
    }
  }, [filtersVisible])

  useEffect(() => {
    isMounted.current = true
  }, [])

  return (
    <DialogWrapper flex={1}>
      <Flex align="center" flex={1}>
        {/* Search field */}
        <Box
          flex={1}
          paddingLeft={onClose ? 2 : 1}
          paddingRight={onClose ? 2 : 0}
          paddingY={onClose ? 2 : 1}
        >
          <CustomTextInput
            border={false}
            clearButton={!!terms.query}
            fontSize={2}
            icon={loading ? <AlignedSpinner /> : SearchIcon}
            onChange={handleQueryChange}
            onClear={handleQueryClear}
            placeholder="Search"
            ref={inputRef}
            smallClearButton
            value={terms.query}
          />
        </Box>

        {/* Filter toggle */}
        <Card borderLeft={!!onClose} padding={onClose ? 2 : 1}>
          <Box style={{position: 'relative'}}>
            <Button
              height="fill"
              icon={ControlsIcon}
              mode="bleed"
              onClick={handleFiltersToggle}
              padding={3}
              ref={filterCloseButton}
              selected={filtersVisible}
              tone="default"
            />
            {terms.types.length > 0 && <NotificationBadge>{terms.types.length}</NotificationBadge>}
          </Box>
        </Card>

        {/* (Fullscreen) Close button */}
        {onClose && (
          <Card borderLeft padding={2}>
            <Button aria-label="Close search" icon={CloseIcon} mode="bleed" onClick={onClose} />
          </Card>
        )}
      </Flex>
    </DialogWrapper>
  )
}

const AlignedSpinner = styled(Spinner)`
  svg {
    width: 20px;
    vertical-align: bottom !important;
  }
`

const DialogWrapper = styled(Card)`
  border-bottom: 1px solid ${hues.gray[200].hex};
  flex-shrink: 0;
`

const NotificationBadge = styled.div`
  align-items: center;
  background: ${hues.blue[700].hex};
  color: ${white.hex};
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
