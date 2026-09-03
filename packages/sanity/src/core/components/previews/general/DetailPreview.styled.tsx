import {Flex, rem, Skeleton, Text, TextSkeleton, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {clsx} from 'clsx'
import {type ComponentProps, type ComponentPropsWithRef} from 'react'
import {Box, type BoxProps} from 'ui5'

import {
  descriptionSkeleton,
  descriptionText,
  descriptionTextMaxHeightVar,
  mediaSkeleton,
  rootFlex,
  statusBox,
  subtitleSkeleton,
  titleSkeleton,
} from './DetailPreview.css'

export function RootFlex(props: ComponentProps<typeof Flex>) {
  const {className, ...rest} = props
  return <Flex {...rest} align="center" className={clsx(rootFlex, className)} />
}

type StatusBoxProps = BoxProps & Omit<ComponentPropsWithRef<'div'>, keyof BoxProps>

export function StatusBox(props: StatusBoxProps) {
  const {className, ...rest} = props
  return <Box {...rest} className={clsx(statusBox, className)} />
}

export function MediaSkeleton(props: ComponentProps<typeof Skeleton>) {
  const {className, ...rest} = props
  return <Skeleton {...rest} animated radius={2} className={clsx(mediaSkeleton, className)} />
}

export function TitleSkeleton(props: ComponentProps<typeof TextSkeleton>) {
  const {className, ...rest} = props
  return (
    <TextSkeleton
      {...rest}
      animated
      radius={1}
      size={1}
      className={clsx(titleSkeleton, className)}
    />
  )
}

export function SubtitleSkeleton(props: ComponentProps<typeof TextSkeleton>) {
  const {className, ...rest} = props
  return (
    <TextSkeleton
      {...rest}
      animated
      radius={1}
      size={1}
      className={clsx(subtitleSkeleton, className)}
    />
  )
}

export function DescriptionSkeleton(props: ComponentProps<typeof TextSkeleton>) {
  const {className, ...rest} = props
  return (
    <TextSkeleton
      {...rest}
      animated
      radius={1}
      size={1}
      className={clsx(descriptionSkeleton, className)}
    />
  )
}

const DESCRIPTION_MAX_LINES = 2

export function DescriptionText(props: ComponentProps<typeof Text>) {
  const {className, style, ...rest} = props
  const {font} = useThemeV2()
  const textSize1 = font.text.sizes[1]
  const maxHeight = textSize1.lineHeight * DESCRIPTION_MAX_LINES

  return (
    <Text
      {...rest}
      className={clsx(descriptionText, className)}
      style={{
        ...assignInlineVars({[descriptionTextMaxHeightVar]: `${rem(maxHeight)}`}),
        ...style,
      }}
    />
  )
}
