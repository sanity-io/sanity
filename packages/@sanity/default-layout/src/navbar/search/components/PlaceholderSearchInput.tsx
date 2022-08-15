/* eslint-disable react/jsx-pascal-case */
import {SearchIcon} from '@sanity/icons'
import {Box, Flex, Inline, KBD, TextInput} from '@sanity/ui'
import React, {forwardRef, KeyboardEvent as ReactKeyboardEvent, Ref, useCallback} from 'react'
import styled from 'styled-components'
import {GLOBAL_SEARCH_KEY_MODIFIER, GLOBAL_SEARCH_KEY} from '../constants'
import {useSearchState} from '../contexts/search'

export const PlaceholderSearchInput = forwardRef(function DummyInput(
  {onOpen}: {onOpen: () => void},
  ref: Ref<HTMLInputElement>
) {
  const {
    dispatch,
    state: {terms},
  } = useSearchState()

  const handleChange = useCallback(
    (event: ReactKeyboardEvent<HTMLInputElement>) => {
      dispatch({type: 'TERMS_QUERY_SET', query: event.currentTarget.value})
      onOpen()
    },
    [dispatch, onOpen]
  )

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        onOpen()
      }
    },
    [onOpen]
  )

  return (
    <PlaceholderSearchInputWrapper align="center">
      <Box flex={1} style={{position: 'relative'}}>
        <TextInput
          aria-autocomplete="list"
          aria-expanded="false"
          autoComplete="off"
          icon={SearchIcon}
          id="studio-search"
          onChange={handleChange}
          onClick={onOpen}
          onKeyDown={handleKeyDown}
          placeholder="Search"
          ref={ref}
          role="combobox"
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
          <KBD style={{marginRight: '1px'}}>{GLOBAL_SEARCH_KEY_MODIFIER.toUpperCase()}</KBD>
          <KBD>{GLOBAL_SEARCH_KEY.toUpperCase()}</KBD>
        </Inline>
      </Box>
    </PlaceholderSearchInputWrapper>
  )
})

const PlaceholderSearchInputWrapper = styled(Flex)`
  min-width: 253px;
  max-width: 350px;
`
