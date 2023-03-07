import {SelectIcon} from '@sanity/icons'
import {
  Box,
  Button,
  Card,
  Flex,
  Inline,
  Popover,
  Stack,
  Text,
  TextInput,
  useClickOutside,
  useGlobalKeyDown,
} from '@sanity/ui'
import {useBoolean, useSelect} from '@sanity/ui-workshop'
import React, {ComponentProps, useCallback, useMemo, useRef, useState} from 'react'
import {CommandListItems} from '../CommandListItems'
import {CommandListProvider, type CommandListVirtualItemProps} from '../CommandListProvider'
import {useCommandList} from '../useCommandList'

const ITEMS = [...Array(50000).keys()]

const SCROLL_ALIGN_OPTIONS = {
  start: 'start',
  center: 'center',
  end: 'end',
} as const

export default function PopoverStory() {
  const closePopoverOnSelect = useBoolean('Close popover on select', true)
  const initialSelectedScrollAlign = useSelect(
    'Initial scroll align',
    SCROLL_ALIGN_OPTIONS,
    'center'
  )

  const [selectedIndex, setSelectedIndex] = useState(100)
  const [open, setOpen] = useState(false)
  const [button, setButton] = useState<HTMLElement | null>(null)
  const [popover, setPopover] = useState<HTMLElement | null>(null)

  const lastSelectedIndex = useRef<number | null>(null)

  const handleChildClick = useCallback(
    (index: number) => {
      if (closePopoverOnSelect) {
        setSelectedIndex(index)
        setOpen(false)
      } else {
        lastSelectedIndex.current = index
      }
    },
    [closePopoverOnSelect]
  )
  const handleClose = useCallback(() => {
    if (typeof lastSelectedIndex.current === 'number' && !closePopoverOnSelect) {
      setSelectedIndex(lastSelectedIndex.current)
    }
    setOpen(false)
  }, [closePopoverOnSelect])
  const handleGlobalKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (open && (event.key === 'Escape' || event.key === 'Tab')) {
        handleClose()
        button?.focus()
      }
    },
    [button, handleClose, open]
  )
  const handleOpen = useCallback(() => setOpen(true), [])
  const handleClick = useCallback(() => {
    if (open) {
      handleClose()
    } else {
      handleOpen()
    }
  }, [handleClose, handleOpen, open])

  useClickOutside(handleClose, [button, popover])
  useGlobalKeyDown(handleGlobalKeyDown)

  const values = ITEMS.map((i) => ({value: i}))

  return (
    <CommandListProvider
      activeItemDataAttr="data-selected"
      ariaChildrenLabel="Children"
      ariaInputLabel="Header"
      autoFocus
      initialScrollAlign={initialSelectedScrollAlign}
      initialIndex={selectedIndex}
      values={values}
    >
      <Card padding={4}>
        <Stack space={3}>
          <Inline space={2}>
            <Popover
              content={<PopoverContent onChildClick={handleChildClick} />}
              open={open}
              portal
              ref={setPopover}
            >
              <Button
                iconRight={SelectIcon}
                onClick={handleClick}
                ref={setButton}
                text="Popover button (open at last selected index)"
                tone="primary"
              />
            </Popover>
            <Button text="Button 1" />
            <Button text="Button 2" />
          </Inline>
          <Box>
            <Text muted size={1}>
              Last selected index: {selectedIndex}
            </Text>
          </Box>
        </Stack>
      </Card>
    </CommandListProvider>
  )
}

interface PopoverContentProps {
  onChildClick: (index: number) => void
}

const PopoverContent = ({onChildClick}: PopoverContentProps) => {
  return (
    <Card radius={2} style={{overflow: 'hidden', width: '175px'}}>
      <CommandListContent onChildClick={onChildClick} />
    </Card>
  )
}

interface CommandListContentProps
  extends Pick<ComponentProps<typeof TextInput>, 'onChange' | 'onClear'> {
  onChildClick: (index: number) => void
}

const CommandListContent = ({onChildClick}: CommandListContentProps) => {
  const {virtualItemDataAttributes} = useCommandList()

  const VirtualListItem = useMemo(() => {
    return function VirtualListItemComponent({value}: CommandListVirtualItemProps<number>) {
      const handleClick = useCallback(() => onChildClick(value), [value])
      return (
        <Button
          {...virtualItemDataAttributes}
          fontSize={1}
          mode="bleed"
          onClick={handleClick}
          style={{borderRadius: 0, width: '100%'}}
          text={`Button ${value.toString()}`}
        />
      )
    }
  }, [onChildClick, virtualItemDataAttributes])

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
