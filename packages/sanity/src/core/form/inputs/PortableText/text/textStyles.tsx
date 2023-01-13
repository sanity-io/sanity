import {Heading, Text} from '@sanity/ui'
import React from 'react'
import styled from 'styled-components'

type TextStyleProps = Omit<React.HTMLProps<HTMLDivElement>, 'as' | 'ref'>
type BlockQuoteStyleProps = Omit<React.HTMLProps<HTMLQuoteElement>, 'as' | 'ref'>

/**
 * Without this container, editing with Android breaks due to how Text is styled via `responsiveFont` in `@sanity/ui`
 */
export const TextContainer = styled.div`
  display: block;
`

/**
 * Portable Text Input built in style
 */
export const Normal = ({children, ...rest}: TextStyleProps) => (
  <Text data-testid="text-style--normal" {...rest}>
    <TextContainer>{children}</TextContainer>
  </Text>
)

/**
 * Styled component for Portable Text 'h1' style
 */
export const Heading1 = ({children, ...rest}: TextStyleProps) => (
  <Heading as="h1" data-testid="text-style--h1" size={5} {...rest}>
    <TextContainer>{children}</TextContainer>
  </Heading>
)

/**
 * Styled component for Portable Text 'h2' style
 */
export const Heading2 = ({children, ...rest}: TextStyleProps) => (
  <Heading as="h2" data-testid="text-style--h2" size={4} {...rest}>
    <TextContainer>{children}</TextContainer>
  </Heading>
)

/**
 * Styled component for Portable Text 'h3' style
 */
export const Heading3 = ({children, ...rest}: TextStyleProps) => (
  <Heading as="h3" data-testid="text-style--h3" size={3} {...rest}>
    <TextContainer>{children}</TextContainer>
  </Heading>
)

/**
 * Styled component for Portable Text 'h4' style
 */
export const Heading4 = ({children, ...rest}: TextStyleProps) => (
  <Heading as="h4" data-testid="text-style--h4" size={2} {...rest}>
    <TextContainer>{children}</TextContainer>
  </Heading>
)

/**
 * Styled component for Portable Text 'h5' style
 */
export const Heading5 = ({children, ...rest}: TextStyleProps) => (
  <Heading as="h5" data-testid="text-style--h5" size={1} {...rest}>
    <TextContainer>{children}</TextContainer>
  </Heading>
)

/**
 * Styled component for Portable Text 'h6' style
 */
export const Heading6 = ({children, ...rest}: TextStyleProps) => (
  <Heading as="h6" data-testid="text-style--h6" size={0} {...rest}>
    <TextContainer>{children}</TextContainer>
  </Heading>
)

const BlockQuoteRoot = styled.blockquote`
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

/**
 * Styled component for Portable Text 'blockquote' style
 */
export const BlockQuote = ({children, ...rest}: TextStyleProps) => (
  <BlockQuoteRoot data-testid="text-style--blockquote" {...(rest as BlockQuoteStyleProps)}>
    <Text as="p">{children}</Text>
  </BlockQuoteRoot>
)

/**
 * Portable Text built in styles.
 */
export const TEXT_STYLES: Record<string, React.ComponentType<TextStyleProps>> = {
  normal: Normal,
  h1: Heading1,
  h2: Heading2,
  h3: Heading3,
  h4: Heading4,
  h5: Heading5,
  h6: Heading6,
  blockquote: BlockQuote,
}
