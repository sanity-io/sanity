import {RevertIcon} from '@sanity/icons/Revert'
import {useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {clsx} from 'clsx'
import {type HTMLProps, type RefAttributes} from 'react'

import {Button, type ButtonProps} from '../../../../ui-components/button/Button'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {revertChangesButton, revertChangesFgColorVar} from './RevertChangesButton.css'

/** @internal */
export function RevertChangesButton(
  props: Omit<ButtonProps, 'tooltipProps'> &
    Omit<HTMLProps<HTMLButtonElement>, 'ref'> & {
      changeCount: number
    } & RefAttributes<HTMLButtonElement>,
) {
  const {ref, selected, changeCount, className, style, ...restProps} = props
  const {t} = useTranslation()
  const {color} = useThemeV2()

  return (
    <Button
      icon={RevertIcon}
      selected={selected}
      text={t('changes.action.revert-changes-confirm-change', {count: changeCount})}
      mode="bleed"
      ref={ref}
      tooltipProps={null}
      {...restProps}
      className={clsx(revertChangesButton, className)}
      style={{
        ...assignInlineVars({[revertChangesFgColorVar]: color.button.default.critical.enabled.bg}),
        ...style,
      }}
    />
  )
}
