import {Box, Flex, rem, Text, Theme} from '@sanity/ui'
import React, {memo} from 'react'
import {ToggleArrowRightIcon} from '@sanity/icons'
import styled, {css} from 'styled-components'
import {focusRingStyle} from './styles'

export interface FormFieldSetLegendProps {
  collapsed: boolean
  collapsible?: boolean
  onClick?: () => void
  title: React.ReactNode
}

const Root = styled.legend`
  /* See: https://thatemil.com/blog/2015/01/03/reset-your-fieldset/ */
  padding: 0;
  display: table;
`

const ToggleButton = styled(Flex).attrs({forwardedAs: 'button'})((props: {theme: Theme}) => {
  const {theme} = props
  const {focusRing, radius} = theme.sanity
  const {base} = theme.sanity.color

  return css`
    appearance: none;
    border: 0;
    background: none;
    color: inherit;
    -webkit-font-smoothing: inherit;
    font: inherit;
    outline: none;
    border-radius: ${rem(radius[1])};
    position: relative;

    &:not([hidden]) {
      display: flex;
    }

    &:focus {
      box-shadow: ${focusRingStyle({base, focusRing})};
    }

    &:focus:not(:focus-visible) {
      box-shadow: none;
    }

    /* Added to increase the hit area of the collapsible fieldset */
    &::after {
      content: '';
      position: absolute;
      top: -10px;
      right: -10px;
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
    <Text weight="semibold" size={1}>
      {title || <span style={{color: 'var(--card-muted-fg-color)'}}>Untitled</span>}
    </Text>
  )

  if (!collapsible) {
    return <Root>{text}</Root>
  }

  return (
    <Root>
      <ToggleButton type="button" onClick={onClick}>
        <ToggleIconBox>
          <Text muted size={1}>
            <ToggleArrowRightIcon
              style={{
                transform: `rotate(${collapsed ? '0' : '90deg'}) translate3d(0, 0, 0)`,
              }}
            />
          </Text>
        </ToggleIconBox>

        {text}
      </ToggleButton>
    </Root>
  )
})
