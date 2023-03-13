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
  useClickOutside,
  useGlobalKeyDown,
} from '@sanity/ui'
import {useBoolean, useSelect} from '@sanity/ui-workshop'
import React, {useCallback, useRef, useState} from 'react'
import {CommandList} from '../CommandList'
import {CommandListRenderItemCallback} from '../types'

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
  const handlePopoverButtonClick = useCallback(() => {
    if (open) {
      handleClose()
    } else {
      handleOpen()
    }
  }, [handleClose, handleOpen, open])

  useClickOutside(handleClose, [button, popover])
  useGlobalKeyDown(handleGlobalKeyDown)

  const renderItem = useCallback<CommandListRenderItemCallback<number>>(
    (item) => {
      return (
        <Button
          fontSize={1}
          mode="bleed"
          // eslint-disable-next-line react/jsx-no-bind
          onClick={() => handleChildClick(item)}
          style={{borderRadius: 0, width: '100%'}}
          text={`Button ${item.toString()}`}
        />
      )
    },
    [handleChildClick]
  )

  return (
    <Card padding={4}>
      <Stack space={3}>
        <Inline space={2}>
          <Popover
            content={
              <Card radius={2} style={{overflow: 'hidden', width: '175px'}}>
                <Flex direction="column" style={{height: '400px'}}>
                  <Card flex={1} shadow={1}>
                    <Flex height="fill">
                      <CommandList
                        activeItemDataAttr="data-selected"
                        ariaLabel="Children"
                        autoFocus
                        fixedHeight
                        initialScrollAlign={initialSelectedScrollAlign}
                        initialIndex={selectedIndex}
                        itemHeight={35}
                        renderItem={renderItem}
                        values={ITEMS}
                      />
                    </Flex>
                  </Card>
                </Flex>
              </Card>
            }
            open={open}
            portal
            ref={setPopover}
          >
            <Button
              iconRight={SelectIcon}
              onClick={handlePopoverButtonClick}
              ref={setButton}
              text="Popover button (open at last selected index)"
              tone="primary"
            />
          </Popover>
        </Inline>
        <Box>
          <Text muted size={1}>
            Last selected index: {selectedIndex}
          </Text>
        </Box>
      </Stack>
    </Card>
  )
}
