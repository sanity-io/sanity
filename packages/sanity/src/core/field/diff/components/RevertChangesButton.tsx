import {RevertIcon} from '@sanity/icons'
import {getVarName, vars} from '@sanity/ui/css'
import {type ForwardedRef, forwardRef, type HTMLProps} from 'react'
import {styled} from 'styled-components'

import {Button, type ButtonProps} from '../../../../ui-components'
import {useTranslation} from '../../../i18n'

const Root = styled(Button)`
  [data-ui='Text'] {
    font-weight: normal;
  }

  div[data-ui='Box'] {
    display: none;
  }

  &:not([data-disabled='true']):hover,
  &:not([data-disabled='true']):focus {
    ${getVarName(vars.color.fg)}: ${vars.color.solid.critical.bg[0]};
    ${getVarName(vars.color.bg)}: transparent;
    ${getVarName(vars.color.border)}: transparent;

    div[data-ui='Box'] {
      display: block;
    }
  }
`

/** @internal */
export const RevertChangesButton = forwardRef(function RevertChangesButton(
  props: Omit<ButtonProps, 'tooltipProps'> &
    Omit<HTMLProps<HTMLButtonElement>, 'ref'> & {changeCount: number},
  ref: ForwardedRef<HTMLButtonElement>,
): React.JSX.Element {
  const {selected, changeCount, ...restProps} = props
  const {t} = useTranslation()

  return (
    <Root
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
