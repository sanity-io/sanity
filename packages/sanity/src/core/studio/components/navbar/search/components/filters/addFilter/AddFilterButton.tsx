import {AddIcon} from '@sanity/icons'
import {Button, Popover} from '@sanity/ui'
import React, {useCallback, useState} from 'react'
import {useSearchState} from '../../../contexts/search/useSearchState'
import {FilterPopoverWrapper} from '../common/FilterPopoverWrapper'
import {AddFilterPopoverContent} from './AddFilterPopoverContent'

export default function AddFilterButton() {
  const [open, setOpen] = useState(false)
  const [buttonElement, setButtonElement] = useState<HTMLElement | null>(null)

  const {
    state: {fullscreen},
  } = useSearchState()

  const handleClose = useCallback(() => setOpen(false), [])
  const handleOpen = useCallback(() => setOpen(true), [])

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
    >
      <Button
        fontSize={1}
        icon={AddIcon}
        mode="bleed"
        onClick={handleOpen}
        padding={fullscreen ? 3 : 2}
        ref={setButtonElement}
        space={2}
        text="Add filter"
      />
    </Popover>
  )
}
