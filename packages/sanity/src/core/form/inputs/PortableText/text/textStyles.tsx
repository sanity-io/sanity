import {Heading, Text, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {clsx} from 'clsx'
import {type ComponentProps, type ComponentType, type HTMLProps} from 'react'

import {blockQuoteRoot, space3Var, textContainer} from './textStyles.css'

type TextStyleProps = Omit<HTMLProps<HTMLDivElement>, 'as' | 'ref'>
type BlockQuoteStyleProps = Omit<HTMLProps<HTMLQuoteElement>, 'as' | 'ref'>

/**
 * Without this container, editing with Android breaks due to how Text is styled via `responsiveFont` in `@sanity/ui`
 */
export function TextContainer(props: ComponentProps<'div'>) {
  const {className, ...rest} = props
  return <div {...rest} className={clsx(textContainer, className)} />
}

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

/**
 * Styled component for Portable Text 'blockquote' style
 */
export const BlockQuote = ({children, className, style, ...rest}: TextStyleProps) => {
  const {space} = useThemeV2()

  return (
    <blockquote
      data-testid="text-style--blockquote"
      {...(rest as BlockQuoteStyleProps)}
      className={clsx(blockQuoteRoot, className)}
      style={{...assignInlineVars({[space3Var]: `${space[3]}px`}), ...style}}
    >
      <Text as="p">{children}</Text>
    </blockquote>
  )
}

/**
 * Portable Text built in styles.
 */
export const TEXT_STYLES: Record<string, ComponentType<TextStyleProps>> = {
  normal: Normal,
  h1: Heading1,
  h2: Heading2,
  h3: Heading3,
  h4: Heading4,
  h5: Heading5,
  h6: Heading6,
  blockquote: BlockQuote,
}
