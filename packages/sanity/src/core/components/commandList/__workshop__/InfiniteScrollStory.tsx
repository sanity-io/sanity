import {Box, Card, Flex, Stack, Text, TextInput} from '@sanity/ui'
import {useBoolean} from '@sanity/ui-workshop'
import React, {KeyboardEvent, useCallback, useMemo, useRef, useState} from 'react'
import styled from 'styled-components'
import {CommandList} from '../CommandList'
import {CommandListHandle, CommandListRenderItemCallback} from '../types'

const ITEM_HEIGHT = 75 // px

const CardContainer = styled(Card)`
  height: 400px;
  max-width: 400px;
  width: 100%;
`

const StyledLink = styled.a<{$index: number}>`
  align-items: center;
  background: ${({$index}) => ($index % 2 === 0 ? '#1a1a1a' : '#1f1f1f')};
  display: flex;
  height: ${ITEM_HEIGHT}px;
  justify-content: center;
  padding: 0 10px;
  &[data-active] {
    background: #333;
  }
`

export default function InfiniteScrollStory() {
  const [items, setItems] = useState([...Array(20).keys()])
  const [inputElement, setInputElement] = useState<HTMLInputElement | null>(null)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<string>('')
  const [message, setMessage] = useState('')
  const showInput = useBoolean('Show input', true, 'Props')
  const wrapAround = useBoolean('Wrap around', false, 'Props')
  const commandListRef = useRef<CommandListHandle | null>(null)

  const filteredValues = useMemo(() => {
    if (!filter) {
      return items
    }
    return items.filter((i) => i.toString().includes(filter))
  }, [filter, items])

  /**
   * Scroll command list to the top on filter query change
   */
  const handleChange = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      setFilter(e.currentTarget.value)
      if (filteredValues.length > 0) {
        commandListRef?.current?.scrollToIndex(0)
      }
    },
    [filteredValues],
  )

  const handleChildClick = useCallback((msg: string) => setMessage(msg), [])

  /**
   * Scroll command list to the top when manually cleared
   */
  const handleClear = useCallback(() => {
    setFilter('')
    if (filteredValues.length > 0) {
      commandListRef?.current?.scrollToIndex(0)
    }
  }, [filteredValues.length])

  /**
   * Load more items, but only if not currently loading and no text filter is defined
   */
  const handleLoadMore = useCallback(async () => {
    if (loading || filter) {
      return
    }

    setLoading(true)
    const results = await fetchData(items.length)
    setItems([...items, ...results])
    setLoading(false)
  }, [filter, items, loading])

  const renderItem = useCallback<CommandListRenderItemCallback<number>>(
    (item) => {
      return (
        <StyledLink
          $index={item}
          // eslint-disable-next-line react/jsx-no-bind
          onClick={() => handleChildClick(`Button ${item.toString()} clicked`)}
        >
          <Text>{item}</Text>
        </StyledLink>
      )
    },
    [handleChildClick],
  )

  return (
    <CardContainer padding={4}>
      <Stack space={3}>
        {showInput && (
          <Box flex="none" marginBottom={2}>
            <TextInput
              aria-label="Header"
              clearButton={filter ? filter.length > 0 : false}
              onClear={handleClear}
              onChange={handleChange}
              placeholder="Filter"
              ref={setInputElement}
              value={filter}
            />
          </Box>
        )}
        <Flex direction="column" style={{height: '400px'}}>
          <Card flex={1} shadow={1}>
            <Flex height="fill" style={{position: 'relative'}}>
              <CommandList
                activeItemDataAttr="data-active"
                ariaLabel="Children"
                autoFocus="input"
                fixedHeight
                inputElement={inputElement}
                itemHeight={ITEM_HEIGHT}
                onEndReached={handleLoadMore}
                onEndReachedIndexOffset={10}
                ref={commandListRef}
                renderItem={renderItem}
                items={filteredValues}
                wrapAround={wrapAround}
              />
            </Flex>
          </Card>
        </Flex>
        {loading && (
          <Box>
            <Text muted size={1}>
              Loading...
            </Text>
          </Box>
        )}
        <Box>
          <Text muted size={1}>
            {message}
          </Text>
        </Box>
      </Stack>
    </CardContainer>
  )
}

function fetchData(fromIndex = 0) {
  return new Promise<number[]>((resolve) => {
    setTimeout(() => {
      const payload = Array.from(Array(10), (_el, i) => i + fromIndex)
      resolve(payload)
    }, 500)
  })
}
