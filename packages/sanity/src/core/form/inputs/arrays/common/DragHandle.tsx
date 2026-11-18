import {DragHandleIcon} from '@sanity/icons/DragHandle'
import {useContext} from 'react'
import {SortableItemHandleContext} from 'sanity/_singletons'
import {css, styled} from 'styled-components'

import {Button, type ButtonProps} from '../../../../../ui-components/button/Button'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'

const DragHandleButton = styled(Button)<{$grid?: boolean; disabled?: boolean}>((props) => {
  const {$grid, disabled} = props
  // touch-action: none is required for @dnd-kit's PointerSensor (configured in
  // ./list.tsx) to receive touch input. Without it, the browser's default
  // touch action (scrolling) wins on mobile and array items can't be
  // reordered. See https://github.com/sanity-io/sanity/issues/12931 and
  // https://docs.dndkit.com/api-documentation/sensors/pointer#recommendations.
  // Keep default touch behavior when disabled/readOnly so scrolling still works.
  if (disabled)
    return css`
      touch-action: auto;
    `
  return css`
    cursor: ${$grid ? 'move' : 'ns-resize'};
    touch-action: none;
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
  const handle = useContext(SortableItemHandleContext)
  const {mode = 'bleed', readOnly, ...rest} = props
  const {t} = useTranslation()
  const activator = readOnly ? null : handle

  return (
    <DragHandleButton
      ref={activator?.setActivatorNodeRef}
      icon={DragHandleIcon}
      tooltipProps={{
        content: t('inputs.array.action.drag.tooltip'),
        delay: {open: 1000},
        disabled: !!readOnly,
      }}
      mode={mode}
      data-ui="DragHandleButton"
      {...rest}
      {...activator?.attributes}
      {...activator?.listeners}
      disabled={readOnly}
    />
  )
}
