import {ChevronDownIcon} from '@sanity/icons'
import {Card, Flex, Inline, Popover, Stack, useClickOutside, useGlobalKeyDown} from '@sanity/ui'
import {useSelect} from '@sanity/ui-workshop'
import React, {useCallback, useState} from 'react'
import {CommandList} from '../CommandList'
import {CommandListRenderItemCallback} from '../types'
import {Button} from '../../../../ui'

const ITEMS = [...Array(50000).keys()]

const SCROLL_ALIGN_OPTIONS = {
  start: 'start',
  center: 'center',
  end: 'end',
} as const

export default function PopoverStory() {
  const initialSelectedScrollAlign = useSelect(
    'Initial scroll align',
    SCROLL_ALIGN_OPTIONS,
    'center',
  )

  const [selectedIndex, setSelectedIndex] = useState(100)
  const [open, setOpen] = useState(false)
  const [button, setButton] = useState<HTMLElement | null>(null)
  const [popover, setPopover] = useState<HTMLElement | null>(null)

  const handleChildClick = useCallback((index: number) => {
    setSelectedIndex(index)
    setOpen(false)
  }, [])
  const handleClose = useCallback(() => {
    setOpen(false)
  }, [])
  const handleGlobalKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (open && (event.key === 'Escape' || event.key === 'Tab')) {
        handleClose()
        button?.focus()
      }
    },
    [button, handleClose, open],
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
          mode="bleed"
          // eslint-disable-next-line react/jsx-no-bind
          onClick={() => handleChildClick(item)}
          style={{borderRadius: 0, width: '100%'}}
          text={`Button ${item.toString()}`}
        />
      )
    },
    [handleChildClick],
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
                        autoFocus="list"
                        fixedHeight
                        initialScrollAlign={initialSelectedScrollAlign}
                        initialIndex={selectedIndex}
                        itemHeight={35}
                        items={ITEMS}
                        renderItem={renderItem}
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
              iconRight={ChevronDownIcon}
              onClick={handlePopoverButtonClick}
              ref={setButton}
              text={`Popover (open at index ${selectedIndex})`}
              tone="primary"
            />
          </Popover>
        </Inline>
      </Stack>
    </Card>
  )
}
