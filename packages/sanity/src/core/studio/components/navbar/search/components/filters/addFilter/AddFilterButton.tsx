import {AddIcon} from '@sanity/icons'
import {Popover} from '@sanity/ui'
import React, {useCallback, useState} from 'react'
import {POPOVER_RADIUS, POPOVER_VERTICAL_MARGIN} from '../../../constants'
import {useSearchState} from '../../../contexts/search/useSearchState'
import {FilterPopoverWrapper} from '../common/FilterPopoverWrapper'
import {Button} from '../../../../../../../../ui'
import {AddFilterPopoverContent} from './AddFilterPopoverContent'

export function AddFilterButton() {
  const [open, setOpen] = useState(false)
  const [buttonElement, setButtonElement] = useState<HTMLElement | null>(null)

  const {
    state: {fullscreen},
  } = useSearchState()

  const handleClose = useCallback(() => setOpen(false), [])
  const handleOpen = useCallback(() => setOpen(true), [])

  return (
    <Popover
      __unstable_margins={[POPOVER_VERTICAL_MARGIN, 0, 0, 0]}
      content={
        <FilterPopoverWrapper anchorElement={buttonElement} onClose={handleClose}>
          <AddFilterPopoverContent onClose={handleClose} />
        </FilterPopoverWrapper>
      }
      open={open}
      placement="bottom-start"
      radius={POPOVER_RADIUS}
      portal
    >
      <Button
        icon={AddIcon}
        mode="bleed"
        onClick={handleOpen}
        size={fullscreen ? 'default' : 'small'}
        ref={setButtonElement}
        selected={open}
        text="Add filter"
      />
    </Popover>
  )
}
