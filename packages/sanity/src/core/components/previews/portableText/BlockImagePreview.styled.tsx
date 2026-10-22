import {Card, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {clsx} from 'clsx'
import {type ComponentProps, type ComponentPropsWithRef, type CSSProperties} from 'react'
import {Box, type BoxProps, Flex} from 'ui5'

import {
  headerFlex,
  mediaCard,
  mediaCardRatioVar,
  rootBox,
  rootBoxRadiusVar,
} from './BlockImagePreview.css'

export function HeaderFlex(props: ComponentProps<typeof Flex>) {
  const {className, ...rest} = props
  return <Flex {...rest} alignItems="center" className={clsx(headerFlex, className)} />
}

export function MediaCard(props: ComponentProps<typeof Card> & {$ratio: number}) {
  const {$ratio, className, style, ...rest} = props
  return (
    <Card
      {...rest}
      className={clsx(mediaCard, className)}
      style={{[mediaCardRatioVar]: `${$ratio}%`, ...style} as CSSProperties}
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
      style={{[rootBoxRadiusVar]: `${radius[1]}px`, ...style} as CSSProperties}
    />
  )
}
