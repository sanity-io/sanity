import {Box, Button, Card, Flex, Stack, Text, TextInput} from '@sanity/ui'
import {useBoolean} from '@sanity/ui-workshop'
import React, {ComponentProps, KeyboardEvent, useCallback, useMemo, useState} from 'react'
import styled from 'styled-components'
import {CommandListItems} from '../CommandListItems'
import {CommandListProvider, type CommandListVirtualItemProps} from '../CommandListProvider'
import {CommandListTextInput} from '../CommandListTextInput'
import {useCommandList} from '../useCommandList'

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
  const [selected, setSelected] = useState<Record<number, boolean>>({})
  const [filter, setFilter] = useState<string>('')
  const [message, setMessage] = useState('')
  const showInput = useBoolean('Show input', true, 'Props')
  const withDisabledItems = useBoolean('With disabled items', true, 'Props')

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

  const handleChange = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => setFilter(e.currentTarget.value),
    []
  )
  const handleChildClick = useCallback(
    ({index, msg}: {msg: string; index: number}) => {
      setMessage(msg)
      toggleSelect(index)
    },
    [toggleSelect]
  )
  const handleClear = useCallback(() => setFilter(''), [])

  const VirtualListItem = useMemo(() => {
    return function VirtualListItemComponent({disabled, value}: CommandListVirtualItemProps<Item>) {
      const handleClick = useCallback(
        () =>
          handleChildClick({
            index: value.index,
            msg: `${value.label} clicked`,
          }),
        [value]
      )
      const isSelected = selected[value.index]
      return (
        <Button
          disabled={disabled}
          mode="bleed"
          onClick={handleClick}
          style={{borderRadius: 0, width: '100%'}}
          text={isSelected ? '👻' : value.label}
          tone={isSelected ? 'critical' : 'primary'}
        />
      )
    }
  }, [handleChildClick, selected])

  const selectedIndices = Object.entries(selected)
    .filter(([_k, v]) => v)
    .map(([k, _v]) => k)
    .join(',')

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
