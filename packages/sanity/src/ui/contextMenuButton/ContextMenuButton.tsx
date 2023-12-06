import {EllipsisHorizontalIcon} from '@sanity/icons'
import React, {HTMLProps, forwardRef} from 'react'
import {useTranslation} from '../../core'
import {Button, ButtonProps} from '../button'

interface ContextMenuButtonProps
  extends Pick<ButtonProps, 'mode' | 'tone' | 'tooltipProps'>,
    Pick<HTMLProps<HTMLButtonElement>, 'disabled' | 'hidden' | 'onClick'> {}

export const ContextMenuButton = forwardRef(function ContextMenuButton(
  props: ContextMenuButtonProps,
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
