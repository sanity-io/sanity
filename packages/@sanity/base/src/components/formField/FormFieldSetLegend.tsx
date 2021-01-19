import {Box, Flex, Text} from '@sanity/ui'
import React from 'react'
import {ToggleArrowRightIcon} from '@sanity/icons'
import styled from 'styled-components'

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

const ToggleButton = styled(Flex).attrs({forwardedAs: 'button'})`
  appearance: none;
  border: 0;
  background: none;
  color: inherit;
  -webkit-font-smoothing: inherit;
  font: inherit;
  outline: none;

  &:not([hidden]) {
    display: flex;
  }

  &:focus {
    /* @todo: prettify */
    box-shadow: 0 0 0 2px #06f;
  }

  &:focus:not(:focus-visible) {
    box-shadow: none;
  }
`

const ToggleIconBox = styled(Box)`
  width: 9px;
  height: 9px;
  margin-right: 3px;

  & svg {
    transition: transform 100ms;
  }
`

export function FormFieldSetLegend(props: FormFieldSetLegendProps) {
  const {collapsed, collapsible, onClick, title} = props

  const text = (
    <Text weight="semibold" size={1}>
      {title || <em>Untitled</em>}
    </Text>
  )

  if (!collapsible) {
    return <Root>{text}</Root>
  }

  return (
    <Root>
      <ToggleButton onClick={onClick}>
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
}
