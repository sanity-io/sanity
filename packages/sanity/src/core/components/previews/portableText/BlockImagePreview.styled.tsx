import {Card, Flex, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {clsx} from 'clsx'
import {type ComponentProps, type ComponentPropsWithRef} from 'react'
import {Box, type BoxProps} from 'ui5'

import {
  headerFlex,
  mediaCard,
  mediaCardRatioVar,
  rootBox,
  rootBoxRadiusVar,
} from './BlockImagePreview.css'

export function HeaderFlex(props: ComponentProps<typeof Flex>) {
  const {className, ...rest} = props
  return <Flex {...rest} align="center" className={clsx(headerFlex, className)} />
}

export function MediaCard(props: ComponentProps<typeof Card> & {$ratio: number}) {
  const {$ratio, className, style, ...rest} = props
  return (
    <Card
      {...rest}
      className={clsx(mediaCard, className)}
      style={{...assignInlineVars({[mediaCardRatioVar]: `${$ratio}%`}), ...style}}
    />
  )
}

type RootBoxProps = BoxProps & Omit<ComponentPropsWithRef<'div'>, keyof BoxProps>

export function RootBox(props: RootBoxProps) {
  const {className, style, ...rest} = props
  const {radius} = useThemeV2()
  return (
    <Box
      {...rest}
      overflow="hidden"
      className={clsx(rootBox, className)}
      style={{...assignInlineVars({[rootBoxRadiusVar]: `${radius[1]}px`}), ...style}}
    />
  )
}
