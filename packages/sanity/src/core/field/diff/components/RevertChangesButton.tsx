import {RevertIcon} from '@sanity/icons'
import {Button, ButtonProps} from '@sanity/ui'
import React, {forwardRef} from 'react'
import {useTranslation} from 'react-i18next'
import styled from 'styled-components'

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
  props: ButtonProps & Omit<React.HTMLProps<HTMLButtonElement>, 'ref'>,
  ref: React.ForwardedRef<HTMLButtonElement>
): React.ReactElement {
  const {selected, ...restProps} = props
  const {t} = useTranslation()

  return (
    <Root
      icon={RevertIcon}
      selected={selected}
      // kept at "count: 2" as a const because this component will always have plurals (and never a singular)
      // the value itself is not used in translation (check the i18n file "studio.ts" for the actual translation)")
      text={t('review-changes.action.revert-changes-confirm-change', {count: 2})}
      mode="bleed"
      padding={1}
      fontSize={1}
      space={2}
      ref={ref}
      {...restProps}
    />
  )
})
