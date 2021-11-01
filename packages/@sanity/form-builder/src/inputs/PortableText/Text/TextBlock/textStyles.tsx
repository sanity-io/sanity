import {Box, Heading, Text} from '@sanity/ui'
import React from 'react'
import styled from 'styled-components'

const BlockQuoteBox = styled(Box)`
  position: relative;

  &:before {
    content: '';
    display: block;
    position: absolute;
    top: -4px;
    left: 0;
    bottom: -4px;
    border-left: 3px solid var(--card-border-color);
  }
`

export const Heading1 = ({children, ...rest}) => (
  <Heading size={5} {...rest}>
    {children}
  </Heading>
)

export const Heading2 = ({children, ...rest}) => (
  <Heading size={4} {...rest}>
    {children}
  </Heading>
)

export const Heading3 = ({children, ...rest}) => (
  <Heading size={3} {...rest}>
    {children}
  </Heading>
)

export const Heading4 = ({children, ...rest}) => (
  <Heading size={2} {...rest}>
    {children}
  </Heading>
)

export const Heading5 = ({children, ...rest}) => (
  <Heading size={1} {...rest}>
    {children}
  </Heading>
)

export const Heading6 = ({children, ...rest}) => (
  <Heading muted size={0} {...rest}>
    {children}
  </Heading>
)

export const Normal = ({children, ...rest}) => <Text {...rest}>{children}</Text>

export const BlockQuote = ({children, ...rest}) => (
  <BlockQuoteBox forwardedAs="blockquote" paddingLeft={3} {...rest}>
    <Text>{children}</Text>
  </BlockQuoteBox>
)
