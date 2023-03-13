import {Box, Button, Card, Flex, Stack, Text, TextInput} from '@sanity/ui'
import {useBoolean} from '@sanity/ui-workshop'
import React, {KeyboardEvent, useCallback, useMemo, useRef, useState} from 'react'
import styled from 'styled-components'
import {CommandList} from '../CommandList'
import {CommandListHandle, CommandListVirtualItemProps} from '../types'

const ITEMS = [...Array(50000).keys()].map((i) => `Button ${i}`)

const CardContainer = styled(Card)`
  height: 400px;
  max-width: 400px;
  width: 100%;
`

export default function FilterableButtonsStory() {
  const [inputElement, setInputElement] = useState<HTMLElement | null>(null)
  const [filter, setFilter] = useState<string>('')
  const [message, setMessage] = useState('')
  const showInput = useBoolean('Show input', true, 'Props')
  const commandListRef = useRef<CommandListHandle | null>(null)

  const filteredValues = useMemo(() => {
    const values = ITEMS.map((i) => ({value: i}))
    if (!filter) {
      return values
    }
    return values.filter((i) => i.value.toLowerCase().includes(filter.toLowerCase()))
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
    [filteredValues]
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

  const renderItem = useCallback(
    (item: CommandListVirtualItemProps<string>) => {
      return (
        <Button
          mode="bleed"
          // eslint-disable-next-line react/jsx-no-bind
          onClick={() => handleChildClick(`${item.value} clicked`)}
          style={{borderRadius: 0, width: '100%'}}
          text={item.value}
          tone="primary"
        />
      )
    },
    [handleChildClick]
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
                activeItemDataAttr="data-hovered"
                ariaLabel="Children"
                autoFocus
                inputElement={inputElement}
                itemHeight={35}
                fixedHeight
                ref={commandListRef}
                renderItem={renderItem}
                values={filteredValues}
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
