import {SelectIcon} from '@sanity/icons'
import {Button, Card, Flex, Inline, Popover, TextInput, useClickOutside} from '@sanity/ui'
import React, {ComponentProps, useCallback, useMemo, useState} from 'react'
import styled from 'styled-components'
import {CommandListItems} from '../CommandListItems'
import {CommandListProvider} from '../CommandListProvider'
import {useCommandList} from '../useCommandList'

const ITEMS = [...Array(50000).keys()]

const CardContainer = styled(Card)`
  height: 400px;
  max-width: 400px;
  width: 100%;
`

export default function PopoverStory() {
  const [open, setOpen] = useState(false)
  const [button, setButton] = useState<HTMLElement | null>(null)
  const [popover, setPopover] = useState<HTMLElement | null>(null)

  const handleClick = useCallback(() => setOpen((prevOpen) => !prevOpen), [])
  const handleClickOutside = useCallback(() => setOpen(false), [])

  useClickOutside(handleClickOutside, [button, popover])

  return (
    <CardContainer padding={4}>
      <Inline space={2}>
        <Popover content={<PopoverContent />} open={open} portal ref={setPopover}>
          <Button
            iconRight={SelectIcon}
            onClick={handleClick}
            ref={setButton}
            text="Popover button (open at index 100)"
            tone="primary"
          />
        </Popover>
        <Button text="Button 1" />
        <Button text="Button 2" />
      </Inline>
    </CardContainer>
  )
}

interface CommandListContentProps
  extends Pick<ComponentProps<typeof TextInput>, 'onChange' | 'onClear'> {
  items: number[]
}

const PopoverContent = () => {
  return (
    <Card radius={2} style={{overflow: 'hidden', width: '175px'}}>
      <CommandListProvider
        activeItemDataAttr="data-selected"
        ariaActiveDescendant={ITEMS.length > 0}
        ariaChildrenLabel="Children"
        ariaInputLabel="Header"
        autoFocus
        itemIndices={[...ITEMS.keys()]}
        initialSelectedIndex={100}
      >
        <CommandListContent items={ITEMS} />
      </CommandListProvider>
    </Card>
  )
}

const CommandListContent = ({items}: CommandListContentProps) => {
  const {virtualItemDataAttr} = useCommandList()

  const VirtualListItem = useMemo(() => {
    return function VirtualListItemComponent({index}: {index: number}) {
      const item = items[index]
      return (
        <Button
          {...virtualItemDataAttr}
          fontSize={1}
          mode="bleed"
          style={{borderRadius: 0, width: '100%'}}
          text={`Button ${item.toString()}`}
        />
      )
    }
  }, [items, virtualItemDataAttr])

  return (
    <Flex direction="column" style={{height: '400px'}}>
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
