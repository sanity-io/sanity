/* eslint-disable react/jsx-pascal-case */
import {SearchIcon} from '@sanity/icons'
import {Flex, KBD, Text} from '@sanity/ui'
import React, {forwardRef, KeyboardEvent as ReactKeyboardEvent, Ref, useCallback} from 'react'
import {GLOBAL_SEARCH_KEY, GLOBAL_SEARCH_KEY_MODIFIER} from '../constants'
import {useSearchState} from '../contexts/search/useSearchState'
import {Button, Tooltip} from '../../../../../../ui'
import {useColorScheme} from '../../../../colorScheme'

export const PlaceholderSearchInput = forwardRef(function DummyInput(
  {onOpen}: {onOpen: () => void},
  ref: Ref<HTMLInputElement>,
) {
  const {
    dispatch,
    state: {terms},
  } = useSearchState()

  const {scheme} = useColorScheme()

  const handleChange = useCallback(
    (event: ReactKeyboardEvent<HTMLInputElement>) => {
      dispatch({type: 'TERMS_QUERY_SET', query: event.currentTarget.value})
      onOpen()
    },
    [dispatch, onOpen],
  )

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        onOpen()
      }
    },
    [onOpen],
  )

  return (
    <Tooltip
      scheme={scheme}
      placement="bottom"
      portal
      content={
        <Flex align="center" gap={3}>
          <Text size={1}>Search</Text>
          <Flex gap={1}>
            <KBD>{GLOBAL_SEARCH_KEY_MODIFIER}</KBD>
            <KBD>{GLOBAL_SEARCH_KEY.toUpperCase()}</KBD>
          </Flex>
        </Flex>
      }
    >
      <Button
        icon={SearchIcon}
        data-testid="studio-search"
        //onChange={handleChange}
        onClick={onOpen}
        mode="bleed"
        //onKeyDown={handleKeyDown}
        //ref={ref}
        role="combobox"
        value={terms.query}
      />
    </Tooltip>
  )
})
