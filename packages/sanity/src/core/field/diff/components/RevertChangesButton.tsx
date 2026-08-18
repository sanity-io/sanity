import {RevertIcon} from '@sanity/icons/Revert'
import {type HTMLProps, type RefAttributes} from 'react'
import {styled} from 'styled-components'

import {Button, type ButtonProps} from '../../../../ui-components/button/Button'
import {useTranslation} from '../../../i18n/hooks/useTranslation'

const Root = styled(Button)`
  [data-ui='Text'] {
    font-weight: normal;
  }

  div[data-ui='Box'] {
    display: none;
  }

  &:not([data-disabled='true']):hover,
  &:not([data-disabled='true']):focus {
    --card-fg-color: ${({theme}) => theme.sanity.color.solid.critical.enabled.bg /* oxlint-disable-line no-deprecated -- will fix in follow up PR */};
    --card-bg-color: transparent;
    --card-border-color: transparent;

    div[data-ui='Box'] {
      display: block;
    }
  }
`

/** @internal */
export function RevertChangesButton(
  props: Omit<ButtonProps, 'tooltipProps'> &
    Omit<HTMLProps<HTMLButtonElement>, 'ref'> & {
      changeCount: number
    } & RefAttributes<HTMLButtonElement>,
) {
  const {ref, selected, changeCount, ...restProps} = props
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
}
