import {CheckmarkIcon, DotIcon} from '@sanity/icons'
import {Box, Card, Flex, Stack, Text, TextInput} from '@sanity/ui'
import {useBoolean} from '@sanity/ui-workshop'
import React, {KeyboardEvent, useCallback, useMemo, useRef, useState} from 'react'
import styled from 'styled-components'
import {Button} from '../../../../ui-components'
import {CommandList} from '../CommandList'
import {
  CommandListGetItemDisabledCallback,
  CommandListGetItemSelectedCallback,
  CommandListHandle,
  CommandListRenderItemCallback,
} from '../types'

type Item = {
  disabled?: boolean
  index: number
  label: string
}

const CardContainer = styled(Card)`
  height: 400px;
  max-width: 400px;
  width: 100%;
`

export default function KitchenSinkStory() {
  const [inputElement, setInputElement] = useState<HTMLInputElement | null>(null)
  const [selected, setSelected] = useState<Record<number, boolean>>({})
  const [filter, setFilter] = useState<string>('')
  const [message, setMessage] = useState('')
  const showInput = useBoolean('Show input', true, 'Props')
  const withDisabledItems = useBoolean('With disabled items', true, 'Props')
  const commandListRef = useRef<CommandListHandle | null>(null)

  const items: Item[] = useMemo(() => {
    return [...Array(50000).keys()].map((i) => ({
      disabled: withDisabledItems && i % 5 === 0,
      index: i,
      label: `Button ${i}`,
    }))
  }, [withDisabledItems])

  const filteredValues = useMemo(() => {
    if (!filter) {
      return items
    }
    return items.filter((i) => i.label.toLowerCase().includes(filter.toLowerCase()))
  }, [filter, items])

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
    [filteredValues],
  )

  const handleChildClick = useCallback(
    ({index, msg}: {msg: string; index: number}) => {
      setMessage(msg)
      toggleSelect(index)
    },
    [toggleSelect],
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

  /**
   * Clear filter, selected values then scroll to top and re-focus command list
   */
  const handleReset = useCallback(() => {
    setFilter('')
    setSelected({})
    commandListRef?.current?.scrollToIndex(0)
    commandListRef?.current?.focusInputElement()
  }, [])

  const getItemDisabled = useCallback<CommandListGetItemDisabledCallback>(
    (virtualIndex) => {
      return !!items[filteredValues[virtualIndex].index].disabled
    },
    [filteredValues, items],
  )

  const getItemSelected = useCallback<CommandListGetItemSelectedCallback>(
    (virtualIndex) => {
      const canonicalIndex = filteredValues[virtualIndex].index
      return !!selected[canonicalIndex]
    },
    [filteredValues, selected],
  )

  const renderItem = useCallback<CommandListRenderItemCallback<Item>>(
    (item, context) => {
      const isDisabled = context.disabled
      const isSelected = context.selected
      return (
        <Button
          disabled={isDisabled}
          icon={isSelected ? CheckmarkIcon : DotIcon}
          justify="flex-start"
          mode="bleed"
          // eslint-disable-next-line react/jsx-no-bind
          onClick={() =>
            handleChildClick({
              index: item.index,
              msg: `${item.label} clicked`,
            })
          }
          style={{borderRadius: 0, width: '100%'}}
          text={isSelected ? `${item.label} (selected)` : item.label}
          tone={isSelected ? 'positive' : 'primary'}
        />
      )
    },
    [handleChildClick],
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
                ariaMultiselectable
                autoFocus="list"
                canReceiveFocus
                fixedHeight
                getItemDisabled={getItemDisabled}
                getItemSelected={getItemSelected}
                inputElement={inputElement}
                itemHeight={35}
                ref={commandListRef}
                renderItem={renderItem}
                items={filteredValues}
              />
            </Flex>
          </Card>
        </Flex>
        <Button disabled={selectedIndices.length === 0} onClick={handleReset} text="Reset" />
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
