import {useSortable} from '@dnd-kit/sortable'
import {DragHandleIcon} from '@sanity/icons'
import {useContext} from 'react'
import {SortableItemIdContext} from 'sanity/_singletons'
import {css, styled} from 'styled-components'

import {Button, type ButtonProps} from '../../../../../ui-components'
import {useTranslation} from '../../../../i18n'

const DragHandleButton = styled(Button)<{$grid?: boolean; disabled?: boolean}>((props) => {
  const {$grid, disabled} = props
  if (disabled) return css``
  return css`
    cursor: ${$grid ? 'move' : 'ns-resize'};
  `
})

interface DragHandleProps {
  $grid?: boolean
  size?: ButtonProps['size']
  mode?: ButtonProps['mode']
  paddingY?: ButtonProps['paddingY']
  readOnly: boolean
}

export const DragHandle = function DragHandle(props: DragHandleProps) {
  const id = useContext(SortableItemIdContext)!
  const {mode = 'bleed', readOnly, ...rest} = props
  const {listeners, attributes} = useSortable({id, disabled: readOnly})
  const {t} = useTranslation()

  return (
    <DragHandleButton
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
