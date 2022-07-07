/* eslint-disable react/jsx-pascal-case */
import {SearchIcon} from '@sanity/icons'
import {Box, Flex, Inline, KBD, TextInput} from '@sanity/ui'
import React, {forwardRef, KeyboardEvent as ReactKeyboardEvent, Ref, useCallback} from 'react'
import {useSearchDispatch, useSearchState} from './state/SearchContext'
import {globalModKey, globalSearchKey} from './utils/search-hotkeys'

export const DummySearchInput = forwardRef(function DummyInput(
  {setOpened}: {setOpened: () => void},
  ref: Ref<HTMLInputElement>
) {
  const {terms} = useSearchState()
  const dispatch = useSearchDispatch()

  const keyboardOpen = useCallback(
    (event: ReactKeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        setOpened()
      }
    },
    [setOpened]
  )

  const handleChange = useCallback(
    (event: ReactKeyboardEvent<HTMLInputElement>) => {
      dispatch({type: 'TEXT_QUERY', query: event.currentTarget.value})
      setOpened()
    },
    [dispatch, setOpened]
  )

  return (
    <Flex align="center" gap={2}>
      <Box flex={1}>
        <TextInput
          icon={SearchIcon}
          id="studio-search"
          placeholder="Search (new)"
          onClick={setOpened}
          border={false}
          ref={ref}
          value={terms.query}
          onChange={handleChange}
          onKeyDown={keyboardOpen}
        />
      </Box>
      <Inline marginRight={2}>
        <KBD>{globalModKey}</KBD>
        <KBD>{globalSearchKey.toUpperCase()}</KBD>
      </Inline>
    </Flex>
  )
})
