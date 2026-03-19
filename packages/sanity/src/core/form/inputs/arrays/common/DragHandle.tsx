import {useSortable} from '@dnd-kit/sortable'
import {DragHandleIcon} from '@sanity/icons'
import {useContext} from 'react'
import {SortableItemIdContext} from 'sanity/_singletons'

import {Button, type ButtonProps} from '../../../../../ui-components'
import {useTranslation} from '../../../../i18n'
import {dragHandleGrid, dragHandleList} from './DragHandle.css'

interface DragHandleProps {
  $grid?: boolean
  size?: ButtonProps['size']
  mode?: ButtonProps['mode']
  paddingY?: ButtonProps['paddingY']
  readOnly: boolean
}

export const DragHandle = function DragHandle(props: DragHandleProps) {
  const id = useContext(SortableItemIdContext)!
  const {mode = 'bleed', readOnly, $grid, ...rest} = props
  const {listeners, attributes} = useSortable({id, disabled: readOnly})
  const {t} = useTranslation()

  return (
    <Button
      className={!readOnly ? ($grid ? dragHandleGrid : dragHandleList) : undefined}
      icon={DragHandleIcon}
      tooltipProps={{
        content: t('inputs.array.action.drag.tooltip'),
        delay: {open: 1000},
        disabled: !!readOnly,
      }}
      mode={mode}
      data-ui="DragHandleButton"
      {...rest}
      {...attributes}
      {...listeners}
      disabled={readOnly}
    />
  )
}
