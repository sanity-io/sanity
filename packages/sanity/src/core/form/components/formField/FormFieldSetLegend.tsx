import {ToggleArrowRightIcon} from '@sanity/icons/ToggleArrowRight'
import {rem, type Theme} from '@sanity/ui'
import {memo, type ReactNode} from 'react'
import {css, styled} from 'styled-components'
import {Text, Flex, Box, Icon} from 'ui5'

import {focusRingStyle} from './styles'

export interface FormFieldSetLegendProps {
  collapsed: boolean
  collapsible?: boolean
  onClick?: () => void
  title: ReactNode
}

const Root = styled.legend`
  /* See: https://thatemil.com/blog/2015/01/03/reset-your-fieldset/ */
  padding: 0;
  display: table;
`

// oxlint-disable-next-line no-deprecated -- will fix in follow up PR
const ToggleButton = styled(Flex).attrs({forwardedAs: 'button'})((props: {theme: Theme}) => {
  const {theme} = props
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  const {focusRing, radius} = theme.sanity
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  const {base} = theme.sanity.color

  return css`
    appearance: none;
    border: 0;
    background: none;
    color: inherit;
    -webkit-font-smoothing: inherit;
    font: inherit;
    outline: none;
    border-radius: ${rem(radius[2])};

    &:not([hidden]) {
      display: flex;
    }

    &:focus {
      box-shadow: ${focusRingStyle({base, focusRing})};
    }

    &:focus:not(:focus-visible) {
      box-shadow: none;
    }

    /*
     * Stretches the hit area over the closest positioned ancestor (the fieldset header row), so
     * the whole row toggles. Interactive siblings in that row need "position: relative" to stay
     * above it.
     */
    &::after {
      content: '';
      position: absolute;
      top: -10px;
      right: 0;
      bottom: -10px;
      left: -10px;
    }
  `
})

const ToggleIconBox = styled(Box)`
  width: 9px;
  height: 9px;
  margin-right: 3px;

  & svg {
    transition: transform 100ms;
  }
`

export const FormFieldSetLegend = memo(function FormFieldSetLegend(props: FormFieldSetLegendProps) {
  const {collapsed, collapsible, onClick, title} = props

  const text = (
    <Text weight="medium" size={1} as="div" trim={true}>
      {title}
    </Text>
  )

  if (!collapsible) {
    return <Root>{text}</Root>
  }

  return (
    <Root>
      <ToggleButton type="button" onClick={onClick}>
        <ToggleIconBox>
          <Icon
            muted
            size={1}
            icon={<ToggleArrowRightIcon />}
            style={{transform: `rotate(${collapsed ? '0' : '90deg'}) translate3d(0, 0, 0)`}}
          />
        </ToggleIconBox>

        {text}
      </ToggleButton>
    </Root>
  )
})
