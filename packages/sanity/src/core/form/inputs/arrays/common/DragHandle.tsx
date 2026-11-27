import {DragHandleIcon} from '@sanity/icons/DragHandle'
import {useContext} from 'react'
import {SortableItemHandleContext} from 'sanity/_singletons'

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
  const handle = useContext(SortableItemHandleContext)
  const {$grid, mode = 'bleed', readOnly, ...rest} = props
  const {t} = useTranslation()
  const activator = readOnly ? null : handle
  const variant = getVariant($grid, readOnly)

  return (
    <Button
      ref={activator?.setActivatorNodeRef}
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
      {...activator?.attributes}
      {...activator?.listeners}
      disabled={readOnly}
    />
  )
}
