import styled from 'styled-components'
import React, {useContext} from 'react'
import {DragHandleIcon} from '@sanity/icons'
import {useSortable} from '@dnd-kit/sortable'
import {Button, ButtonProps} from '../../../../../ui'

const DragHandleButton = styled(Button)<{grid?: boolean}>`
  cursor: ${(props) => (props.grid ? 'move' : 'ns-resize')};
`

export const SortableItemIdContext = React.createContext<string | null>(null)

export const DragHandle = function DragHandle(
  props: {
    grid?: boolean
  } & ButtonProps,
) {
  const id = useContext(SortableItemIdContext)!
  const {listeners, attributes} = useSortable({id})

  return (
    <DragHandleButton
      icon={DragHandleIcon}
      mode="bleed"
      data-ui="DragHandleButton"
      {...attributes}
      {...props}
      {...listeners}
    />
  )
}
