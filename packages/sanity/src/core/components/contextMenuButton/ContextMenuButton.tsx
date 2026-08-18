import {EllipsisHorizontalIcon} from '@sanity/icons/EllipsisHorizontal'
import {type HTMLProps, type RefAttributes} from 'react'

import {Button, type ButtonProps} from '../../../ui-components/button/Button'
import {useTranslation} from '../../i18n/hooks/useTranslation'

type ContextMenuButtonProps = Pick<
  ButtonProps,
  'mode' | 'selected' | 'size' | 'tone' | 'tooltipProps' | 'loading'
>

/**
 * Simple context menu button (with horizontal ellipsis icon) with shared localization.
 *
 * @internal
 */
export function ContextMenuButton(
  props: ContextMenuButtonProps &
    Pick<HTMLProps<HTMLButtonElement>, 'disabled' | 'hidden' | 'onClick'> &
    RefAttributes<HTMLButtonElement>,
) {
  const {ref, mode = 'bleed', tooltipProps, tone, ...rest} = props

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
}
