import {RevertIcon} from '@sanity/icons'
import {useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {type ForwardedRef, forwardRef, type HTMLProps, useMemo} from 'react'

import {Button, type ButtonProps} from '../../../../ui-components'
import {useTranslation} from '../../../i18n'
import {revertErrorColorVar, root} from './RevertChangesButton.css'

/** @internal */
export const RevertChangesButton = forwardRef(function RevertChangesButton(
  props: Omit<ButtonProps, 'tooltipProps'> &
    Omit<HTMLProps<HTMLButtonElement>, 'ref'> & {changeCount: number},
  ref: ForwardedRef<HTMLButtonElement>,
): React.JSX.Element {
  const {selected, changeCount, ...restProps} = props
  const {t} = useTranslation()
  const {color} = useThemeV2()

  const vars = useMemo(
    () => assignInlineVars({[revertErrorColorVar]: color.solid.critical.enabled.bg}),
    [color],
  )

  return (
    <Button
      className={root}
      style={vars}
      icon={RevertIcon}
      selected={selected}
      text={t('changes.action.revert-changes-confirm-change', {count: changeCount})}
      mode="bleed"
      ref={ref}
      tooltipProps={null}
      {...restProps}
    />
  )
})
