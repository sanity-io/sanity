import {SelectIcon} from '@sanity/icons'
import {Button, Flex, Popover, Text, useClickOutside} from '@sanity/ui'
import React, {useCallback, useState} from 'react'
import {useSearchState} from '../../contexts/search/useSearchState'
import {DocumentTypes} from './DocumentTypes'
import {FilterPopoverWrapper} from './FilterPopoverWrapper'

function FilterContent({onClose}: {onClose: () => void}) {
  // TODO: DRY
  return (
    <FilterPopoverWrapper onClose={onClose}>
      <Flex
        // padding={3}
        style={{
          maxHeight: '600px',
          maxWidth: '350px',
          overflow: 'hidden',
          width: '100%',
        }}
      >
        <DocumentTypes />
      </Flex>
    </FilterPopoverWrapper>
  )
}

export default function DocumentTypeButton() {
  const [open, setOpen] = useState(false)
  const [buttonElement, setButtonElement] = useState<HTMLElement | null>(null)
  const [popoverElement, setPopoverElement] = useState<HTMLElement | null>(null)

  const {
    state: {
      terms: {types},
    },
  } = useSearchState()

  const handleClose = useCallback(() => setOpen(false), [])
  const handleOpen = useCallback(() => setOpen(true), [])

  useClickOutside(handleClose, [buttonElement, popoverElement])

  const value =
    types.length > 0 ? types.map((type) => type?.title || type.name).join(', ') : 'All types'

  return (
    <Popover
      // arrow={false}
      content={<FilterContent onClose={handleClose} />}
      open={open}
      placement="bottom-start"
      portal
      ref={setPopoverElement}
    >
      <Button
        fontSize={1}
        mode="ghost"
        onClick={handleOpen}
        padding={2}
        ref={setButtonElement}
        style={{maxWidth: '100%'}}
        tone="default"
      >
        <Flex align="center" justify="space-between" gap={2}>
          <Text size={1} textOverflow="ellipsis" weight="medium">
            {value}
          </Text>
          <Text size={1}>
            <SelectIcon />
          </Text>
        </Flex>
      </Button>
    </Popover>
  )
}
