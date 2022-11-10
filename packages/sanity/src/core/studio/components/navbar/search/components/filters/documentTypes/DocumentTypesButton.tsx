import {SelectIcon} from '@sanity/icons'
import {Button, Flex, Popover, Text, useClickOutside} from '@sanity/ui'
import React, {useCallback, useState} from 'react'
import {useSearchState} from '../../../contexts/search/useSearchState'
import {DocumentTypesTruncated} from '../../DocumentTypesTruncated'
import {DocumentTypesPopoverContent} from './DocumentTypesPopoverContent'

export default function DocumentTypesButton() {
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

  return (
    <Popover
      content={<DocumentTypesPopoverContent onClose={handleClose} />}
      open={open}
      placement="bottom-start"
      portal
      ref={setPopoverElement}
    >
      <Button
        mode="ghost"
        onClick={handleOpen}
        padding={2}
        ref={setButtonElement}
        style={{maxWidth: '100%'}}
        tone="default"
      >
        <Flex align="center" justify="space-between" gap={2}>
          {types.length > 0 ? (
            <DocumentTypesTruncated types={types} />
          ) : (
            <Text size={1}>All types</Text>
          )}
          <Text size={1}>
            <SelectIcon />
          </Text>
        </Flex>
      </Button>
    </Popover>
  )
}
