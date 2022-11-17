import {AddIcon} from '@sanity/icons'
import {Button, Popover, useClickOutside} from '@sanity/ui'
import React, {useCallback, useState} from 'react'
import {FilterPopoverWrapper} from '../common/FilterPopoverWrapper'
import {AddFilterPopoverContent} from './AddFilterPopoverContent'

export default function AddFilterButton() {
  const [open, setOpen] = useState(false)
  const [buttonElement, setButtonElement] = useState<HTMLElement | null>(null)
  const [popoverElement, setPopoverElement] = useState<HTMLElement | null>(null)

  const handleClose = useCallback(() => setOpen(false), [])
  const handleOpen = useCallback(() => setOpen(true), [])

  useClickOutside(handleClose, [buttonElement, popoverElement])

  return (
    <Popover
      content={
        <FilterPopoverWrapper anchorElement={buttonElement} onClose={handleClose}>
          <AddFilterPopoverContent onClose={handleClose} />
        </FilterPopoverWrapper>
      }
      open={open}
      placement="bottom-start"
      portal
      ref={setPopoverElement}
    >
      <Button
        fontSize={1}
        icon={AddIcon}
        mode="bleed"
        onClick={handleOpen}
        padding={2}
        ref={setButtonElement}
        text="Add filter"
      />
    </Popover>
  )
}
