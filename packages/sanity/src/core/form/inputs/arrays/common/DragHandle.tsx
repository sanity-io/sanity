import {useSortable} from '@dnd-kit/sortable'
import {DragHandleIcon} from '@sanity/icons/DragHandle'
import {useContext} from 'react'
import {SortableItemIdContext} from 'sanity/_singletons'

import {Button, type ButtonProps} from '../../../../../ui-components/button/Button'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {dragHandleButton} from './DragHandle.css'

interface DragHandleProps {
  $grid?: boolean
  size?: ButtonProps['size']
  mode?: ButtonProps['mode']
  paddingY?: ButtonProps['paddingY']
  readOnly: boolean
}

function getVariant($grid: boolean | undefined, disabled: boolean) {
  if (disabled) return 'disabled'
  return $grid ? 'grid' : 'list'
}

export const DragHandle = function DragHandle(props: DragHandleProps) {
  const id = useContext(SortableItemIdContext)!
  const {$grid, mode = 'bleed', readOnly, ...rest} = props
  const {listeners, attributes} = useSortable({id, disabled: readOnly})
  const {t} = useTranslation()
  const variant = getVariant($grid, readOnly)

  return (
    <Button
      className={dragHandleButton[variant]}
      icon={DragHandleIcon}
      tooltipProps={{
        content: t('inputs.array.action.drag.tooltip'),
        delay: {open: 1000},
        disabled: !!readOnly,
      }}
      mode={mode}
      data-ui="DragHandleButton"
      // Mirrors the `touch-action` value of the class above so tests can assert on it
      data-touch-action={variant === 'disabled' ? 'auto' : 'none'}
      {...rest}
      {...attributes}
      {...listeners}
      disabled={readOnly}
    />
  )
}
