/* eslint-disable react/jsx-pascal-case */
import {SearchIcon} from '@sanity/icons'
import {Box, Flex, Inline, KBD, TextInput} from '@sanity/ui'
import React, {forwardRef, KeyboardEvent as ReactKeyboardEvent, Ref, useCallback} from 'react'
import {useOmnisearch} from './state/OmnisearchContext'
import {globalModKey, globalSearchKey} from './utils/search-hotkeys'

export const PlaceholderSearchInput = forwardRef(function DummyInput(
  {setOpened}: {setOpened: () => void},
  ref: Ref<HTMLInputElement>
) {
  const {
    dispatch,
    state: {terms},
  } = useOmnisearch()

  const handleChange = useCallback(
    (event: ReactKeyboardEvent<HTMLInputElement>) => {
      dispatch({type: 'TERMS_QUERY_SET', query: event.currentTarget.value})
      setOpened()
    },
    [dispatch, setOpened]
  )

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        setOpened()
      }
    },
    [setOpened]
  )

  return (
    <Flex align="center">
      <Box flex={1} style={{position: 'relative'}}>
        <TextInput
          autoComplete="off"
          icon={SearchIcon}
          id="studio-search"
          onChange={handleChange}
          onClick={setOpened}
          onKeyDown={handleKeyDown}
          placeholder="Search"
          ref={ref}
          style={{paddingRight: '60px'}}
          value={terms.query}
        />
        <Inline
          marginRight={2}
          style={{
            alignItems: 'center',
            display: 'flex',
            height: '100%',
            position: 'absolute',
            right: 0,
            top: 0,
          }}
        >
          <KBD style={{marginRight: '1px'}}>{globalModKey.toUpperCase()}</KBD>
          <KBD>{globalSearchKey.toUpperCase()}</KBD>
        </Inline>
      </Box>
    </Flex>
  )
})
