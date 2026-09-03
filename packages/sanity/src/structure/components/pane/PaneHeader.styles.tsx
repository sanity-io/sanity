import {Card, Flex, Layer, Text, TextSkeleton, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {clsx} from 'clsx'
import {type ComponentProps} from 'react'

import {
  layout,
  root,
  rootBorder,
  rootNoBorder,
  titleCard,
  titleCardBgVar,
  titleCardFgVar,
  titleText,
  titleTextSkeleton,
} from './PaneHeader.styles.css'

interface RootProps {
  $border?: boolean
}

export function Root(props: ComponentProps<typeof Layer> & RootProps) {
  const {$border, className, ...rest} = props
  return <Layer {...rest} className={clsx(root, $border ? rootBorder : rootNoBorder, className)} />
}

export function Layout(props: ComponentProps<typeof Flex>) {
  const {className, ...rest} = props
  return <Flex {...rest} className={clsx(layout, className)} />
}

export function TitleCard(props: ComponentProps<typeof Card>) {
  const {className, style, ...rest} = props
  const {color} = useThemeV2()
  const {bg, fg} = color.selectable.default.enabled

  return (
    <Card
      {...rest}
      className={clsx(titleCard, className)}
      style={{...assignInlineVars({[titleCardBgVar]: bg, [titleCardFgVar]: fg}), ...style}}
    />
  )
}

export function TitleTextSkeleton(props: ComponentProps<typeof TextSkeleton>) {
  const {className, ...rest} = props
  return <TextSkeleton {...rest} className={clsx(titleTextSkeleton, className)} />
}

export function TitleText(props: ComponentProps<typeof Text>) {
  const {className, ...rest} = props
  return <Text {...rest} className={clsx(titleText, className)} />
}
