import {Box, Card, Flex, Stack, Text, TextInput} from '@sanity/ui'
import {useBoolean} from '@sanity/ui-workshop'
import React, {KeyboardEvent, useCallback, useMemo, useRef, useState} from 'react'
import styled from 'styled-components'
import {CommandList} from '../CommandList'
import {CommandListHandle, CommandListRenderItemCallback} from '../types'

const ITEMS = [...Array(50000).keys()]

const CardContainer = styled(Card)`
  height: 400px;
  max-width: 400px;
  width: 100%;
`

const StyledLink = styled.a<{$index: number}>`
  background: ${({$index}) => ($index % 2 === 0 ? '#1a1a1a' : '#1f1f1f')};
  display: block;
  padding: 10px;
  &[data-active] {
    background: #333;
  }
`

export default function FilterableStory() {
  const [inputElement, setInputElement] = useState<HTMLInputElement | null>(null)
  const [filter, setFilter] = useState<string>('')
  const [message, setMessage] = useState('')
  const onlyShowSelectionWhenActive = useBoolean('Only show selection when active', false, 'Props')
  const canReceiveFocus = useBoolean('Can receive focus', true, 'Props')
  const showInput = useBoolean('Show input', true, 'Props')
  const commandListRef = useRef<CommandListHandle | null>(null)

  const filteredValues = useMemo(() => {
    if (!filter) {
      return ITEMS
    }
    return ITEMS.filter((i) => i.toString().includes(filter))
  }, [filter])

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
                canReceiveFocus={canReceiveFocus}
                fixedHeight
                inputElement={inputElement}
                itemHeight={30}
                items={filteredValues}
                onlyShowSelectionWhenActive={onlyShowSelectionWhenActive}
                ref={commandListRef}
                renderItem={renderItem}
              />
            </Flex>
          </Card>
        </Flex>
        <Box>
          <Text muted size={1}>
            {message}
          </Text>
        </Box>
      </Stack>
    </CardContainer>
  )
}
