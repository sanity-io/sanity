import {assignInlineVars} from '@vanilla-extract/dynamic'
import {clsx} from 'clsx'
import {type ComponentProps} from 'react'

import {
  bottomRegionWrapper,
  middleRegionWrapper,
  overlayWrapper,
  rootWrapper,
  topRegionWrapper,
  topVar,
} from './RegionsWithIntersections.styled.css'
import {WithIntersection} from './WithIntersection'

interface StyleProps {
  $debug: boolean
  margins?: [number, number, number, number]
}

type RegionWrapperProps = StyleProps & ComponentProps<typeof WithIntersection>

export function RootWrapper(props: ComponentProps<'div'>) {
  const {className, ...rest} = props
  return <div {...rest} className={clsx(rootWrapper, className)} />
}

export function OverlayWrapper(props: ComponentProps<'div'>) {
  const {className, ...rest} = props
  return <div {...rest} className={clsx(overlayWrapper, className)} />
}

export function TopRegionWrapper(props: RegionWrapperProps) {
  const {$debug, margins, className, style, ...rest} = props

  return (
    <WithIntersection
      {...rest}
      className={clsx(topRegionWrapper[$debug ? 'debug' : 'default'], className)}
      style={{
        ...assignInlineVars({[topVar]: margins ? `${margins[0] - 1}px` : undefined}),
        ...style,
      }}
    />
  )
}

export function MiddleRegionWrapper(props: RegionWrapperProps) {
  const {$debug, className, ...rest} = props

  return (
    <WithIntersection
      {...rest}
      className={clsx(middleRegionWrapper[$debug ? 'debug' : 'default'], className)}
    />
  )
}

export function BottomRegionWrapper(props: RegionWrapperProps) {
  const {$debug, className, ...rest} = props

  return (
    <WithIntersection
      {...rest}
      className={clsx(bottomRegionWrapper[$debug ? 'debug' : 'default'], className)}
    />
  )
}
