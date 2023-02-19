import {Box, Card, Flex, Text, TextInput} from '@sanity/ui'
import {useBoolean} from '@sanity/ui-workshop'
import React, {
  ComponentProps,
  KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import styled from 'styled-components'
import {CommandListContainer} from '../CommandListContainer'
import {CommandListItems} from '../CommandListItems'
import {CommandListProvider} from '../CommandListProvider'
import {useCommandList} from '../useCommandList'

const ITEMS = [...Array(50000).keys()]

const CardContainer = styled(Card)`
  height: 400px;
  max-width: 400px;
  width: 100%;
`

const StyledBox = styled(Box)<{$index: number}>`
  background: ${({$index}) => ($index % 2 === 0 ? '#1a1a1a' : '#1f1f1f')};
`

export default function CommandListStory() {
  const [filter, setFilter] = useState<string>('')
  const showInput = useBoolean('Show input', true, 'Props')

  const filteredItems = useMemo(() => {
    if (!filter) {
      return ITEMS
    }
    return ITEMS.filter((i) => i.toString().includes(filter))
  }, [filter])

  const handleClear = useCallback(() => {
    setFilter('')
  }, [])

  const handleChange = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    setFilter(e.currentTarget.value)
  }, [])

  return (
    <CardContainer padding={4}>
      <CommandListProvider
        ariaActiveDescendant={filteredItems.length > 0}
        ariaChildrenLabel="Children"
        ariaInputLabel="Header"
        autoFocus
        itemIndices={[...filteredItems.keys()]}
      >
        <CommandListContent
          filter={filter}
          items={filteredItems}
          onClear={handleClear}
          onChange={handleChange}
          showInput={showInput}
        />
      </CommandListProvider>
    </CardContainer>
  )
}

interface CommandListContentProps
  extends Pick<ComponentProps<typeof TextInput>, 'onChange' | 'onClear'> {
  filter?: string
  items: number[]
  showInput?: boolean
}

const CommandListContent = ({
  filter,
  items,
  onChange,
  onClear,
  showInput,
}: CommandListContentProps) => {
  const {setInputElement, virtualizer} = useCommandList()

  const VirtualListItem = useMemo(() => {
    return function VirtualListItemComponent({index}: {index: number}) {
      const item = items[index]
      return (
        <StyledBox
          $index={index} //
          data-command-list-item
          padding={2}
        >
          <Text>{item}</Text>
        </StyledBox>
      )
    }
  }, [items])

  const handleChange = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (onChange) {
        onChange(e)
        if (items.length > 0) {
          virtualizer?.scrollToIndex(0)
        }
      }
    },
    [items, onChange, virtualizer]
  )

  const handleClear = useCallback(() => {
    if (onClear) {
      onClear()
      if (items.length > 0) {
        virtualizer?.scrollToIndex(0)
      }
    }
  }, [items, onClear, virtualizer])

  useEffect(() => {
    if (!showInput) {
      setInputElement(null)
    }
  }, [setInputElement, showInput])

  return (
    <Flex direction="column" style={{height: '400px'}}>
      {showInput && (
        <Box marginBottom={2} style={{flexShrink: 0}}>
          <TextInput
            clearButton={filter ? filter.length > 0 : false}
            onClear={handleClear}
            onChange={handleChange}
            placeholder="Filter"
            ref={setInputElement}
            value={filter}
          />
        </Box>
      )}

      <Card flex={1} shadow={1}>
        <CommandListContainer>
          <CommandListItems
            fixedHeight
            item={VirtualListItem}
            virtualizerOptions={{
              estimateSize: () => 25,
            }}
          />
        </CommandListContainer>
      </Card>
    </Flex>
  )
}
