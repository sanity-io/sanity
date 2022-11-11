/* eslint-disable react/jsx-pascal-case */
import {SearchIcon} from '@sanity/icons'
import {Flex, KBD, TextInput} from '@sanity/ui'
import React, {forwardRef, KeyboardEvent as ReactKeyboardEvent, Ref, useCallback} from 'react'
import styled from 'styled-components'
import {GLOBAL_SEARCH_KEY, GLOBAL_SEARCH_KEY_MODIFIER} from '../constants'
import {useSearchState} from '../contexts/search/useSearchState'

const KeyboardShortcutFlex = styled(Flex)`
  position: absolute;
  right: 0;
  top: 0;

  & > :first-child {
    margin-right: 1px;
  }
`

const PlaceholderSearchInputFlex = styled(Flex)`
  min-width: 253px;
  max-width: 350px;
  position: relative;
`

const PlaceholderTextInput = styled(TextInput)`
  padding-right: 60px;
`

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
    <PlaceholderSearchInputFlex align="center">
      <PlaceholderTextInput
        aria-autocomplete="list"
        aria-expanded="false"
        autoComplete="off"
        icon={SearchIcon}
        data-testid="studio-search"
        onChange={handleChange}
        onClick={onOpen}
        onKeyDown={handleKeyDown}
        placeholder="Search"
        radius={2}
        ref={ref}
        role="combobox"
        value={terms.query}
      />
      <KeyboardShortcutFlex align="center" height="fill" marginRight={2}>
        <KBD>{GLOBAL_SEARCH_KEY_MODIFIER}</KBD>
        <KBD>{GLOBAL_SEARCH_KEY.toUpperCase()}</KBD>
      </KeyboardShortcutFlex>
    </PlaceholderSearchInputFlex>
  )
})
