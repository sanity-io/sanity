import {EllipsisHorizontalIcon} from '@sanity/icons'
import React, {HTMLProps, forwardRef} from 'react'
import {useTranslation} from '../..'
import {Button, ButtonProps} from '../../../ui-components'

type ContextMenuButtonProps = Pick<
  ButtonProps,
  'mode' | 'paddingY' | 'size' | 'tone' | 'tooltipProps'
>

/**
 * Simple context menu button (with horizontal ellipsis icon) with shared localization.
 *
 * @internal
 */
export const ContextMenuButton = forwardRef(function ContextMenuButton(
  props: ContextMenuButtonProps &
    Pick<HTMLProps<HTMLButtonElement>, 'disabled' | 'hidden' | 'onClick'>,
  ref: React.ForwardedRef<HTMLButtonElement>,
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
