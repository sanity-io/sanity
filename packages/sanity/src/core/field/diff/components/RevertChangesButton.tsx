import {RevertIcon} from '@sanity/icons'
import {Button, ButtonProps} from '@sanity/ui'
import React, {forwardRef} from 'react'
import styled from 'styled-components'
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
    --card-fg-color: ${({theme}) => theme.sanity.color.solid.critical.enabled.bg};
    --card-bg-color: transparent;
    --card-border-color: transparent;

    div[data-ui='Box'] {
      display: block;
    }
  }
`

/** @internal */
export const RevertChangesButton = forwardRef(function RevertChangesButton(
  props: ButtonProps & Omit<React.HTMLProps<HTMLButtonElement>, 'ref'> & {changeCount: number},
  ref: React.ForwardedRef<HTMLButtonElement>,
): React.ReactElement {
  const {selected, changeCount, ...restProps} = props
  const {t} = useTranslation()

  return (
    <Root
      icon={RevertIcon}
      selected={selected}
      text={t('changes.action.revert-changes-confirm-change', {count: changeCount})}
      mode="bleed"
      padding={1}
      fontSize={1}
      space={2}
      ref={ref}
      {...restProps}
    />
  )
})
