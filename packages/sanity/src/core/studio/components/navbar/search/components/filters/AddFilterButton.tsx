import {AddIcon} from '@sanity/icons'
import {Button, Popover} from '@sanity/ui'
import React, {useCallback, useState} from 'react'
import {AddFilterContent} from './AddFilterContent'

export default function AddFilterButton() {
  const [open, setOpen] = useState(false)

  const handleClose = useCallback(() => setOpen(false), [])
  const handleOpen = useCallback(() => setOpen(true), [])

  return (
    <Popover
      // arrow={false}
      content={<AddFilterContent onClose={handleClose} />}
      open={open}
      placement="bottom-start"
      portal
    >
      <Button
        fontSize={1}
        icon={AddIcon}
        mode="ghost"
        onClick={handleOpen}
        padding={2}
        text="Add filter"
      />
    </Popover>
  )
}
