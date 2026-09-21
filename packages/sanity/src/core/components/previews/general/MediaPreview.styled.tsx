import {Skeleton, Stack} from '@sanity/ui'
import {clsx} from 'clsx'
import {type ComponentProps, type ComponentPropsWithRef} from 'react'
import {Box, type BoxProps, Flex} from 'ui5'

import {
  mediaFlex,
  mediaSkeleton,
  progressFlex,
  rootBox,
  tooltipContentStack,
} from './MediaPreview.css'

type RootBoxProps = BoxProps & Omit<ComponentPropsWithRef<'div'>, keyof BoxProps>

export function RootBox(props: RootBoxProps) {
  const {className, ...rest} = props
  return <Box {...rest} className={clsx(rootBox, className)} />
}

export function MediaFlex(props: ComponentProps<typeof Flex>) {
  const {className, ...rest} = props
  return (
    <Flex
      {...rest}
      alignItems="center"
      justifyContent="center"
      className={clsx(mediaFlex, className)}
    />
  )
}

export function MediaSkeleton(props: ComponentProps<typeof Skeleton>) {
  const {className, ...rest} = props
  return <Skeleton {...rest} animated radius={2} className={clsx(mediaSkeleton, className)} />
}

export function ProgressFlex(props: ComponentProps<typeof Flex>) {
  const {className, ...rest} = props
  return (
    <Flex
      {...rest}
      alignItems="center"
      justifyContent="center"
      className={clsx(progressFlex, className)}
    />
  )
}

export function TooltipContentStack(props: ComponentProps<typeof Stack>) {
  const {className, ...rest} = props
  return <Stack {...rest} gap={2} className={clsx(tooltipContentStack, className)} />
}
