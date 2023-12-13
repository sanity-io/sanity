import styled from 'styled-components'
import React, {useContext} from 'react'
import {DragHandleIcon} from '@sanity/icons'
import {useSortable} from '@dnd-kit/sortable'
import {Button, ButtonProps} from '../../../../../ui'
import {useTranslation} from '../../../../i18n'

const DragHandleButton = styled(Button)<{grid?: boolean}>`
  cursor: ${(props) => (props.grid ? 'move' : 'ns-resize')};
`

export const SortableItemIdContext = React.createContext<string | null>(null)

interface DragHandleProps {
  grid?: boolean
  size?: ButtonProps['size']
  mode?: ButtonProps['mode']
  paddingY?: ButtonProps['paddingY']
}

export const DragHandle = function DragHandle(props: DragHandleProps) {
  const id = useContext(SortableItemIdContext)!
  const {listeners, attributes} = useSortable({id})
  const {t} = useTranslation()
  const {mode = 'bleed', ...rest} = props

  return (
    <DragHandleButton
      icon={DragHandleIcon}
      tooltipProps={{
        content: t('inputs.array.action.drag.tooltip'),
        delay: {open: 1000},
      }}
      mode={mode}
      data-ui="DragHandleButton"
      {...attributes}
      {...rest}
      {...listeners}
    />
  )
}
