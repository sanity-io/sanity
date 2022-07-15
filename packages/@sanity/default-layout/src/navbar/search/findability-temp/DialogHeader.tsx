import {hues} from '@sanity/color'
import {ControlsIcon, SearchIcon} from '@sanity/icons'
import {Box, Button, Flex, Spinner, Text, TextInput, useGlobalKeyDown} from '@sanity/ui'
import React, {MutableRefObject, useCallback, useEffect, useRef} from 'react'
import styled from 'styled-components'
import {useOmnisearch} from './state/OmnisearchContext'
import {isSearchHotKey} from './utils/search-hotkeys'

export function DialogHeader() {
  const openedInput = useRef<HTMLInputElement>()
  const {
    dispatch,
    state: {
      filtersVisible,
      result: {loading},
      terms,
    },
  } = useOmnisearch()

  // Focus search input when hotkey is pressed
  useSearchHotkeyListener(openedInput)

  const handleFiltersToggle = useCallback(() => dispatch({type: 'FILTERS_TOGGLE'}), [dispatch])
  const handleQueryChange = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) =>
      dispatch({type: 'TERMS_QUERY_SET', query: e.currentTarget.value}),
    [dispatch]
  )
  const handleQueryClear = useCallback(() => {
    dispatch({type: 'TERMS_QUERY_SET', query: ''})
  }, [dispatch])

  // Immediately focus on mount
  useEffect(() => openedInput.current?.focus(), [])

  return (
    <Container>
      <Flex align="center" flex={1}>
        {/* Search field */}
        <Box flex={1} padding={1}>
          <TextInput
            border={false}
            clearButton={!!terms.query}
            fontSize={2}
            icon={loading ? <AlignedSpinner /> : SearchIcon}
            onChange={handleQueryChange}
            onClear={handleQueryClear}
            placeholder="Search"
            ref={openedInput}
            value={terms.query}
          />
        </Box>

        {/* Filter toggle */}
        <Flex paddingRight={1}>
          <Box style={{position: 'relative'}}>
            <Button
              icon={ControlsIcon}
              // mode="bleed"
              mode="ghost"
              onClick={handleFiltersToggle}
              padding={3}
              selected={filtersVisible}
              tone="default"
            />
            {!filtersVisible && terms.types.length > 0 && <NotificationBadge />}
          </Box>
        </Flex>
      </Flex>
    </Container>
  )
}

function useSearchHotkeyListener(input: MutableRefObject<HTMLInputElement>) {
  const handleGlobalKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (isSearchHotKey(event)) {
        event.preventDefault()
        input.current?.focus()
      }
    },
    [input]
  )

  useGlobalKeyDown(handleGlobalKeyDown)
}

// TODO: find a way to reliably vertically center (and scale) custom components when used as <TextInput> icons
const AlignedSpinner = styled(Spinner)`
  svg {
    width: 20px;
    vertical-align: bottom !important;
  }
`

const Container = styled(Box)`
  border-bottom: 1px solid ${hues.gray[100].hex};
  flex-shrink: 0;

  /* TODO: remove this hack, which is currently used to vertically center <TextInput>'s clearButton */
  [data-qa='clear-button'] {
    display: flex;
  }
`

const NotificationBadge = styled(Box)`
  background: ${hues.blue[700].hex};
  border-radius: 100%;
  height: 6px;
  position: absolute;
  right: 3px;
  top: 3px;
  width: 6px;
`
