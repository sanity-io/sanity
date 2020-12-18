import styled from 'styled-components'
import {Button} from '@sanity/ui'
import React from 'react'
import {DragHandleIcon} from '@sanity/icons'
import {DRAG_HANDLE_ATTRIBUTE, sortableHandle} from '../sortable'

const DragHandleButton = styled(Button)`
  cursor: ns-resize;
`

const DRAG_HANDLE_PROPS = {[DRAG_HANDLE_ATTRIBUTE]: true}

export const DragHandle = sortableHandle(function DragHandle() {
  return (
    <DragHandleButton
      icon={DragHandleIcon}
      mode="bleed"
      padding={2}
      tabIndex={0}
      {...DRAG_HANDLE_PROPS}
    />
  )
})
