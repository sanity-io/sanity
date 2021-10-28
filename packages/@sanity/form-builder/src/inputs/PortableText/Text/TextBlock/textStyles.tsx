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

export const Heading1 = ({children}) => (
  <Heading as="h1" size={5}>
    {children}
  </Heading>
)

export const Heading2 = ({children}) => (
  <Heading as="h2" size={4}>
    {children}
  </Heading>
)

export const Heading3 = ({children}) => (
  <Heading as="h3" size={3}>
    {children}
  </Heading>
)

export const Heading4 = ({children}) => (
  <Heading as="h4" size={2}>
    {children}
  </Heading>
)

export const Heading5 = ({children}) => (
  <Heading as="h5" size={1}>
    {children}
  </Heading>
)

export const Heading6 = ({children}) => (
  <Heading as="h6" muted size={0}>
    {children}
  </Heading>
)

export const Normal = ({children}) => <Text as="p">{children}</Text>

export const BlockQuote = ({children}) => (
  <BlockQuoteBox forwardedAs="blockquote" paddingLeft={3}>
    <Text as="p">{children}</Text>
  </BlockQuoteBox>
)
