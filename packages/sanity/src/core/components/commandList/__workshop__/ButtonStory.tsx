import {Box, Button, Card, Flex, Stack, Text, TextInput} from '@sanity/ui'
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

const ITEMS = [...Array(50000).keys()].map((i) => `Button ${i}`)

const CardContainer = styled(Card)`
  height: 400px;
  max-width: 400px;
  width: 100%;
`

export default function ButtonStory() {
  const [filter, setFilter] = useState<string>('')
  const [message, setMessage] = useState('')
  const showInput = useBoolean('Show input', false, 'Props')

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

  return (
    <CardContainer padding={4}>
      <Stack space={3}>
        <CommandListProvider
          activeItemDataAttr="data-selected"
          ariaChildrenLabel="Children"
          ariaInputLabel="Header"
          autoFocus
          values={filteredValues}
        >
          <CommandListContent
            filter={filter}
            onChildClick={handleChildClick}
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
  const {setInputElement, values, virtualizer, virtualItemDataAttr} = useCommandList<string>()

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
    return function VirtualListItemComponent({value}: CommandListVirtualItemProps<string>) {
      const handleClick = useCallback(() => onChildClick(`${value} clicked`), [value])
      return (
        <Button
          {...virtualItemDataAttr}
          mode="bleed"
          onClick={handleClick}
          style={{borderRadius: 0, width: '100%'}}
          text={value}
          tone="primary"
        />
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
              estimateSize: () => 35,
            }}
          />
        </Flex>
      </Card>
    </Flex>
  )
}
