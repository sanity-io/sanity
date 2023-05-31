import {Card, CardProps} from '@sanity/ui'
import React, {HTMLProps} from 'react'
import styled from 'styled-components'

const Root = styled(Card)({
  position: 'relative',
  zIndex: 1,
  lineHeight: 0,

  '&:after': {
    content: '""',
    display: 'block',
    position: 'absolute',
    left: 0,
    bottom: -1,
    right: 0,
    borderBottom: '1px solid var(--card-border-color)',
    opacity: 0.5,
  },
})

/** @internal */
export function DocumentInspectorHeaderCard(
  props: {as?: CardProps['as']; flex?: CardProps['flex']} & Omit<
    HTMLProps<HTMLDivElement>,
    'as' | 'height' | 'ref'
  >
) {
  const {as: forwardedAs, children, ...restProps} = props

  return (
    <Root {...restProps} as={forwardedAs}>
      {children}
    </Root>
  )
}
