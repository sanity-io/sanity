import {Box, Card, Flex, Stack, Text, TextInput} from '@sanity/ui'
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
import {CommandListItems} from '../CommandListItems'
import {CommandListProvider, type CommandListVirtualItemProps} from '../CommandListProvider'
import {useCommandList} from '../useCommandList'

const ITEMS = [...Array(50000).keys()]

const CardContainer = styled(Card)`
  height: 400px;
  max-width: 400px;
  width: 100%;
`

const StyledBox = styled(Box)<{$index: number}>`
  background: ${({$index}) => ($index % 2 === 0 ? '#1a1a1a' : '#1f1f1f')};
  &[data-active] {
    background: blue;
    color: white;
  }
`

export default function DefaultStory() {
  const [filter, setFilter] = useState<string>('')
  const [message, setMessage] = useState('')
  const showInput = useBoolean('Show input', true, 'Props')

  const filteredValues = useMemo(() => {
    const values = ITEMS.map((i) => ({value: i}))
    if (!filter) {
      return values
    }
    return values.filter((i) => i.value.toString().includes(filter))
  }, [filter])

  const handleChange = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    setFilter(e.currentTarget.value)
  }, [])

  const handleChildClick = useCallback((msg: string) => {
    setMessage(msg)
  }, [])

  const handleClear = useCallback(() => {
    setFilter('')
  }, [])

  return (
    <CardContainer padding={4}>
      <Stack space={3}>
        <CommandListProvider
          activeItemDataAttr="data-active"
          ariaActiveDescendant={filteredValues.length > 0}
          ariaChildrenLabel="Children"
          ariaInputLabel="Header"
          autoFocus
          values={filteredValues}
        >
          <CommandListContent
            filter={filter}
            onChange={handleChange}
            onChildClick={handleChildClick}
            onClear={handleClear}
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
  onChildClick: (message: string) => void
  showInput?: boolean
}

const CommandListContent = ({
  filter,
  onChange,
  onChildClick,
  onClear,
  showInput,
}: CommandListContentProps) => {
  const {setInputElement, values, virtualizer, virtualItemDataAttr} = useCommandList<number>()

  const handleChange = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (onChange) {
        onChange(e)
        if (values.length > 0) {
          virtualizer?.scrollToIndex(0)
        }
      }
    },
    [onChange, virtualizer, values.length]
  )

  const handleClear = useCallback(() => {
    if (onClear) {
      onClear()
      if (values.length > 0) {
        virtualizer?.scrollToIndex(0)
      }
    }
  }, [onClear, values.length, virtualizer])

  useEffect(() => {
    if (!showInput) {
      setInputElement(null)
    }
  }, [setInputElement, showInput])

  const VirtualListItem = useMemo(() => {
    return function VirtualListItemComponent({value}: CommandListVirtualItemProps<number>) {
      const handleClick = useCallback(
        () => onChildClick(`Button ${value.toString()} clicked`),
        [value]
      )
      return (
        <StyledBox {...virtualItemDataAttr} $index={value} onClick={handleClick} padding={2}>
          <Text>{value}</Text>
        </StyledBox>
      )
    }
  }, [onChildClick, virtualItemDataAttr])

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
        <Flex height="fill">
          <CommandListItems
            fixedHeight
            item={VirtualListItem}
            virtualizerOptions={{
              estimateSize: () => 25,
            }}
          />
        </Flex>
      </Card>
    </Flex>
  )
}
