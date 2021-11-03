import {Heading, Text} from '@sanity/ui'
import React from 'react'
import styled from 'styled-components'

const BlockQuoteDiv = styled.div`
  position: relative;
  display: block;
  margin: 0;
  padding-left: ${({theme}) => theme.sanity.space[3]}px;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: -4px;
    bottom: -4px;
    width: 3px;
    background: var(--card-border-color);
  }
`

export const Heading1 = ({children, ...rest}) => (
  <Heading as="h1" data-testid="heading1" size={5} {...rest}>
    {children}
  </Heading>
)

export const Heading2 = ({children, ...rest}) => (
  <Heading as="h2" data-testid="heading2" size={4} {...rest}>
    {children}
  </Heading>
)

export const Heading3 = ({children, ...rest}) => (
  <Heading as="h3" data-testid="heading3" size={3} {...rest}>
    {children}
  </Heading>
)

export const Heading4 = ({children, ...rest}) => (
  <Heading as="h4" data-testid="heading4" size={2} {...rest}>
    {children}
  </Heading>
)

export const Heading5 = ({children, ...rest}) => (
  <Heading as="h5" data-testid="heading5" size={1} {...rest}>
    {children}
  </Heading>
)

export const Heading6 = ({children, ...rest}) => (
  <Heading as="h6" data-testid="heading6" size={0} {...rest}>
    {children}
  </Heading>
)

export const Normal = ({children, ...rest}) => (
  <Text as="p" data-testid="normal" {...rest}>
    {children}
  </Text>
)

export const BlockQuote = ({children, ...rest}) => (
  <BlockQuoteDiv as="blockquote" data-testid="blockquote" {...rest}>
    <Text>{children}</Text>
  </BlockQuoteDiv>
)
