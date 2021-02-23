import styled from 'styled-components'
import {Button} from '@sanity/ui'
import React from 'react'
import {DragHandleIcon} from '@sanity/icons'
import {DRAG_HANDLE_ATTRIBUTE, sortableHandle} from './sortable'

const DragHandleButton = styled(Button)<{grid?: boolean}>`
  cursor: ${(props) => (props.grid ? 'move' : 'ns-resize')};
`

const DRAG_HANDLE_PROPS = {[DRAG_HANDLE_ATTRIBUTE]: true}

export const DragHandle = sortableHandle(function DragHandle(props: {
  grid?: boolean
  padding?: number | number[]
  paddingX?: number | number[]
  paddingY?: number | number[]
}) {
  return (
    <DragHandleButton
      icon={DragHandleIcon}
      mode="bleed"
      tabIndex={0}
      {...props}
      {...DRAG_HANDLE_PROPS}
    />
  )
})
