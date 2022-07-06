import {CloseCircleIcon, FilterIcon, SearchIcon} from '@sanity/icons'
import {Box, Button, Card, Flex, Menu, Stack, TextInput, useClickOutside} from '@sanity/ui'
import React, {useCallback, useEffect, useRef, useState} from 'react'
import styled from 'styled-components'
import {TypeFilter} from './TypeFilter'
import {useSearchDispatch, useSearchState} from './state/SearchContext'
import {SearchResults} from './SearchResults'

const DialogCard = styled(Card)`
  position: absolute;
  top: 0;
  left: 20px;
  z-index: 10;
  width: 70vw;
`

export interface OmnisearchPopoverProps {
  close: () => void
}

export function OmnisearchPopover(props: OmnisearchPopoverProps) {
  const {close} = props
  const [dialogEl, setDialogEl] = useState<HTMLDivElement>()
  const [resultKey, setResultKey] = useState<string>(`${Math.random()}`)
  const openedInput = useRef<HTMLInputElement>()
  useClickOutside(close, [dialogEl])
  const dispatch = useSearchDispatch()
  const {query, schemas, searchState} = useSearchState()
  const [filterOpen, setFilterOpen] = useState(false)

  const queryChanged = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) =>
      dispatch({type: 'TEXT_QUERY', query: e.currentTarget.value}),
    [dispatch]
  )

  const clearTerms = useCallback(
    () => dispatch({type: 'SET_TERMS', terms: {query: '', schemas: []}}),
    [dispatch]
  )

  const toggleFilterOpen = useCallback(() => setFilterOpen((current) => !current), [setFilterOpen])
  const onRecentSearchClick = useCallback(() => openedInput.current?.focus(), [])

  useEffect(() => {
    openedInput.current?.focus()
  }, [])

  useEffect(() => {
    if (searchState.loading) {
      //setResultKey(`${Math.random()}`)
    }
  }, [searchState])

  useEffect(() => {
    setFilterOpen((current) => current || schemas.length > 0)
  }, [schemas])

  return (
    <DialogCard
      data-ui="omnisearch-dialog"
      scheme="light"
      border
      shadow={2}
      overflow="hidden"
      ref={setDialogEl}
    >
      <Menu key={resultKey}>
        <Stack flex={1} overflow="hidden">
          <Card flex={1} border>
            <Flex flex={1}>
              <Box flex={1}>
                <TextInput
                  border={false}
                  ref={openedInput}
                  icon={SearchIcon}
                  placeholder="Search"
                  value={query ?? ''}
                  onChange={queryChanged}
                />
              </Box>
              <Button
                mode="bleed"
                icon={CloseCircleIcon}
                onClick={clearTerms}
                arial-label="Clear search terms"
              />
              <Button mode="bleed" icon={FilterIcon} onClick={toggleFilterOpen} text="Filter" />
            </Flex>
          </Card>
          <Flex align="flex-start" gap={2}>
            <SearchResults onResultClick={close} onRecentSearchClick={onRecentSearchClick} />
            {filterOpen && <TypeFilter />}
          </Flex>
        </Stack>
      </Menu>
    </DialogCard>
  )
}
