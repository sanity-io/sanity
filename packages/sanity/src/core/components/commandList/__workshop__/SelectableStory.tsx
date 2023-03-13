import {Box, Button, Card, Flex, Stack, Text, TextInput} from '@sanity/ui'
import {useBoolean} from '@sanity/ui-workshop'
import React, {KeyboardEvent, useCallback, useMemo, useRef, useState} from 'react'
import styled from 'styled-components'
import {CommandList} from '../CommandList'
import {CommandListHandle, CommandListVirtualItemProps} from '../types'

type Item = {
  index: number
  label: string
}

const ITEMS: Item[] = [...Array(50000).keys()].map((i) => ({
  index: i,
  label: `Button ${i}`,
}))

const CardContainer = styled(Card)`
  height: 400px;
  max-width: 400px;
  width: 100%;
`

export default function SelectableStory() {
  const [inputElement, setInputElement] = useState<HTMLElement | null>(null)
  const [selected, setSelected] = useState<Record<number, boolean>>({})
  const [filter, setFilter] = useState<string>('')
  const [message, setMessage] = useState('')
  const showInput = useBoolean('Show input', true, 'Props')
  const withDisabledItems = useBoolean('With disabled items', true, 'Props')
  const commandListRef = useRef<CommandListHandle | null>(null)

  const filteredValues = useMemo(() => {
    let values = ITEMS.map((i) => ({value: i}))

    if (withDisabledItems) {
      values = values.map((v, index) => {
        const isDisabled = index % 5 === 0
        return {
          ...v,
          disabled: isDisabled,
          value: {
            ...v.value,
            label: isDisabled ? `${v.value.label} (disabled)` : v.value.label,
          },
        }
      })
    }

    if (!filter) {
      return values
    }
    return values.filter((i) => i.value.label.toLowerCase().includes(filter.toLowerCase()))
  }, [filter, withDisabledItems])

  const toggleSelect = useCallback((index: number) => {
    setSelected((prevSelected) => ({
      ...prevSelected,
      [index]: !prevSelected?.[index] ?? true,
    }))
  }, [])

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

  const handleChildClick = useCallback(
    ({index, msg}: {msg: string; index: number}) => {
      setMessage(msg)
      toggleSelect(index)
    },
    [toggleSelect]
  )

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
    (item: CommandListVirtualItemProps<Item>) => {
      const isSelected = selected[item.value.index]
      return (
        <Button
          disabled={item.disabled}
          mode="bleed"
          // eslint-disable-next-line react/jsx-no-bind
          onClick={() =>
            handleChildClick({
              index: item.value.index,
              msg: `${item.value.label} clicked`,
            })
          }
          style={{borderRadius: 0, width: '100%'}}
          text={isSelected ? '👻' : item.value.label}
          tone={isSelected ? 'critical' : 'primary'}
        />
      )
    },
    [handleChildClick, selected]
  )

  const selectedIndices = Object.entries(selected)
    .filter(([_k, v]) => v)
    .map(([k, _v]) => k)
    .join(',')

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
                fixedHeight
                inputElement={inputElement}
                itemHeight={35}
                ref={commandListRef}
                renderItem={renderItem}
                values={filteredValues}
              />
            </Flex>
          </Card>
        </Flex>
        <Stack space={2}>
          <Text muted size={1} textOverflow="ellipsis">
            {selectedIndices ? `Selected indices: ${selectedIndices}` : 'No items selected'}
          </Text>
          <Text muted size={1}>
            {message}
          </Text>
        </Stack>
      </Stack>
    </CardContainer>
  )
}
