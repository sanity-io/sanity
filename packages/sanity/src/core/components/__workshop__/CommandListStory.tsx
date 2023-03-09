import {CheckmarkIcon} from '@sanity/icons'
import {Button, Container, Card, Stack, Text} from '@sanity/ui'
import React, {useCallback, useState} from 'react'
import {CommandListProvider, CommandListSearch, ItemContext} from '../command-list'
import {CommandListItems} from '../command-list/CommandListItems'

interface TestItem {
  title: string
}

const RANDOM_ITEMS: TestItem[] = [...Array(100000).keys()].map((i) => ({title: `Item ${i + 1}`}))
const ITEM_HEIGHT = 33

export default function TestStory() {
  const [selectedItems, setSelectedItems] = useState<TestItem[]>([])
  const [items, setItems] = useState<TestItem[]>(RANDOM_ITEMS)
  const [textInputRef, setTextInputRef] = useState<HTMLInputElement | null>(null)

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.currentTarget.value
    const nextItems = RANDOM_ITEMS.filter((item) =>
      item.title.toLowerCase().includes(value.toLowerCase())
    )
    setItems(nextItems)
  }, [])

  const handleItemClick = useCallback(
    (item: TestItem) => {
      const isSelected = selectedItems.find((i) => i.title === item.title)

      if (isSelected) {
        setSelectedItems(selectedItems.filter((i) => i.title !== item.title))
      } else {
        setSelectedItems([...selectedItems, item])
      }

      textInputRef?.focus()
    },
    [selectedItems, textInputRef]
  )

  const renderItem = useCallback(
    (item: TestItem, context: ItemContext) => {
      const isSelected = selectedItems.find((i) => i.title === item.title)

      return (
        <Button
          fontSize={1}
          iconRight={isSelected ? CheckmarkIcon : undefined}
          justify="flex-start"
          mode={isSelected ? 'default' : 'bleed'}
          // eslint-disable-next-line react/jsx-no-bind
          onClick={() => handleItemClick(item)}
          radius={0}
          selected={context.active}
          style={{width: '100%'}}
          text={item.title}
          tone={isSelected ? 'primary' : 'default'}
          disabled={context.index % 2 === 0 || context.index === 3}
        />
      )
    },
    [handleItemClick, selectedItems]
  )

  return (
    <Container width={0} padding={3} paddingY={6}>
      <Stack space={2}>
        <Text size={1} weight="semibold">
          Filterable command list
        </Text>

        <Stack space={1}>
          <CommandListProvider
            height={ITEM_HEIGHT * 15}
            itemHeight={ITEM_HEIGHT}
            items={items}
            overScan={5}
          >
            <CommandListSearch
              placeholder="Search"
              onChange={handleSearchChange}
              ref={setTextInputRef}
              radius={2}
            />

            <Card border radius={2} overflow="hidden">
              <CommandListItems renderItem={renderItem} />
            </Card>
          </CommandListProvider>
        </Stack>
      </Stack>
    </Container>
  )
}
