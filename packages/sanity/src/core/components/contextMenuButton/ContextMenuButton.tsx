import {EllipsisHorizontalIcon} from '@sanity/icons'
import {type ForwardedRef, forwardRef, type HTMLProps} from 'react'

import {Button, type ButtonProps} from '../../../ui-components'
import {useTranslation} from '../..'

type ContextMenuButtonProps = Pick<
  ButtonProps,
  'mode' | 'selected' | 'size' | 'tone' | 'tooltipProps'
>

/**
 * Simple context menu button (with horizontal ellipsis icon) with shared localization.
 *
 * @internal
 */
export const ContextMenuButton = forwardRef(function ContextMenuButton(
  props: ContextMenuButtonProps &
    Pick<HTMLProps<HTMLButtonElement>, 'disabled' | 'hidden' | 'onClick'>,
  ref: ForwardedRef<HTMLButtonElement>,
) {
  const {mode = 'bleed', tooltipProps, tone, ...rest} = props

  const {t} = useTranslation()

  return (
    <Button
      {...rest}
      icon={EllipsisHorizontalIcon}
      mode={mode}
      ref={ref}
      tone={tone}
      tooltipProps={{
        ...tooltipProps,
        content: tooltipProps?.content || t('common.context-menu-button.tooltip'),
      }}
    />
  )
})
