/* eslint-disable no-restricted-imports */
import {EllipsisHorizontalIcon} from '@sanity/icons'
import {Placement} from '@sanity/ui'
import React, {HTMLProps, forwardRef} from 'react'
import {Button, ButtonProps} from '../button'
import {useTranslation} from 'sanity'

interface ContextMenuButtonProps
  extends Pick<ButtonProps, 'mode' | 'tone'>,
    Pick<HTMLProps<HTMLButtonElement>, 'disabled' | 'hidden' | 'onClick'> {
  tooltipPlacement?: Placement
}

export const ContextMenuButton = forwardRef(function ContextMenuButton(
  props: ContextMenuButtonProps,
  ref: React.ForwardedRef<HTMLButtonElement>,
) {
  const {mode = 'bleed', tooltipPlacement, tone, ...rest} = props

  const {t} = useTranslation()

  return (
    <Button
      {...rest}
      icon={EllipsisHorizontalIcon}
      mode={mode}
      ref={ref}
      tone={tone}
      tooltipProps={{
        content: t('common.context-menu-button.tooltip'),
        placement: tooltipPlacement,
      }}
    />
  )
})
