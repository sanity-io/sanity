import {AddIcon} from '@sanity/icons'
import {Button, Popover, useClickOutside} from '@sanity/ui'
import React, {useCallback, useState} from 'react'
import {AddFilterContent} from './AddFilterContent'

export default function AddFilterButton() {
  const [open, setOpen] = useState(false)
  const [buttonElement, setButtonElement] = useState<HTMLElement | null>(null)
  const [popoverElement, setPopoverElement] = useState<HTMLElement | null>(null)

  const handleClose = useCallback(() => setOpen(false), [])
  const handleOpen = useCallback(() => setOpen(true), [])

  useClickOutside(handleClose, [buttonElement, popoverElement])

  return (
    <Popover
      // arrow={false}
      content={<AddFilterContent onClose={handleClose} />}
      open={open}
      placement="bottom-start"
      portal
      ref={setPopoverElement}
    >
      <Button
        fontSize={1}
        icon={AddIcon}
        mode="ghost"
        onClick={handleOpen}
        padding={2}
        ref={setButtonElement}
        text="Add filter"
      />
    </Popover>
  )
}
