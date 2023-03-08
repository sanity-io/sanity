import {Box, Button, Card, Flex, Stack, Text, TextInput} from '@sanity/ui'
import {useBoolean} from '@sanity/ui-workshop'
import React, {ComponentProps, KeyboardEvent, useCallback, useMemo, useState} from 'react'
import styled from 'styled-components'
import {CommandListItems} from '../CommandListItems'
import {CommandListProvider, type CommandListVirtualItemProps} from '../CommandListProvider'
import {CommandListTextInput} from '../CommandListTextInput'
import {useCommandList} from '../useCommandList'

const ITEMS = [...Array(50000).keys()].map((i) => `Button ${i}`)

const CardContainer = styled(Card)`
  height: 400px;
  max-width: 400px;
  width: 100%;
`

export default function FilterableButtonsStory() {
  const [filter, setFilter] = useState<string>('')
  const [message, setMessage] = useState('')
  const showInput = useBoolean('Show input', true, 'Props')

  const filteredValues = useMemo(() => {
    const values = ITEMS.map((i) => ({value: i}))
    if (!filter) {
      return values
    }
    return values.filter((i) => i.value.toLowerCase().includes(filter.toLowerCase()))
  }, [filter])

  const handleChange = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => setFilter(e.currentTarget.value),
    []
  )
  const handleChildClick = useCallback((msg: string) => setMessage(msg), [])
  const handleClear = useCallback(() => setFilter(''), [])

  const VirtualListItem = useMemo(() => {
    return function VirtualListItemComponent({value}: CommandListVirtualItemProps<string>) {
      const handleClick = useCallback(() => handleChildClick(`${value} clicked`), [value])
      return (
        <Button
          mode="bleed"
          onClick={handleClick}
          style={{borderRadius: 0, width: '100%'}}
          text={value}
          tone="primary"
        />
      )
    }
  }, [handleChildClick])

  return (
    <CardContainer padding={4}>
      <Stack space={3}>
        <CommandListProvider
          activeItemDataAttr="data-selected"
          ariaChildrenLabel="Children"
          ariaInputLabel="Header"
          autoFocus
          itemComponent={VirtualListItem}
          fixedHeight
          values={filteredValues}
          virtualizerOptions={{
            estimateSize: () => 35,
          }}
        >
          <CommandListContent
            filter={filter}
            onClear={handleClear}
            onChange={handleChange}
            showInput={showInput}
          />
        </CommandListProvider>
        <Box>
          <Text muted size={1}>
            {message}
          </Text>
        </Box>
      </Stack>
    </CardContainer>
  )
}

interface CommandListContentProps
  extends Pick<ComponentProps<typeof TextInput>, 'onChange' | 'onClear'> {
  filter?: string
  showInput?: boolean
}

const CommandListContent = ({filter, onChange, onClear, showInput}: CommandListContentProps) => {
  const {values, virtualizer} = useCommandList<string>()

  /**
   * Scroll command list to the top on filter query change
   */
  const handleChange = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (onChange) {
        onChange(e)
        if (values.length > 0) {
          virtualizer?.scrollToIndex(0)
        }
      }
    },
    [onChange, values.length, virtualizer]
  )

  /**
   * Scroll command list to the top when manually cleared
   */
  const handleClear = useCallback(() => {
    if (onClear) {
      onClear()
      if (values.length > 0) {
        virtualizer?.scrollToIndex(0)
      }
    }
  }, [onClear, values.length, virtualizer])

  return (
    <Flex direction="column" style={{height: '400px'}}>
      {showInput && (
        <Box marginBottom={2} style={{flexShrink: 0}}>
          <CommandListTextInput
            clearButton={filter ? filter.length > 0 : false}
            onClear={handleClear}
            onChange={handleChange}
            placeholder="Filter"
            value={filter}
          />
        </Box>
      )}

      <Card flex={1} shadow={1}>
        <Flex height="fill">
          <CommandListItems />
        </Flex>
      </Card>
    </Flex>
  )
}
