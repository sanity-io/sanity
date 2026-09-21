import {assignInlineVars} from '@vanilla-extract/dynamic'
import {clsx} from 'clsx'
import {type ComponentProps} from 'react'

import {
  bottomRegionWrapper,
  contentWrapper,
  middleRegionWrapper,
  overlayWrapper,
  rootWrapper,
  topRegionWrapper,
  topVar,
} from './RegionsWithIntersections.styled.css'
import {WithIntersection} from './WithIntersection'

interface StyleProps {
  $debug: boolean
  $margins?: [number, number, number, number]
}

type RegionWrapperProps = StyleProps & ComponentProps<typeof WithIntersection>

/**
 * The in-flow children are the top sentinel, the content wrapper and the bottom sentinel. Laying
 * them out as a flex column lets the content wrapper fill the root when the root is given a
 * definite height (e.g. inside the fullscreen Portable Text editor), so `height: 100%` chains
 * through it. With an auto height root this is equivalent to normal block flow. A flex column
 * rather than a grid: a grid item's containing block is its grid area, which would pin the sticky
 * sentinels to their own 1px rows, while a flex item's is the whole container.
 */
export function RootWrapper(props: ComponentProps<'div'>) {
  const {className, ...rest} = props
  return <div {...rest} className={clsx(rootWrapper, className)} />
}

/** Wraps the overlay's children; grows to fill the root, never shrinks below its content */
export function ContentWrapper(props: ComponentProps<'div'>) {
  const {className, ...rest} = props
  return <div {...rest} className={clsx(contentWrapper, className)} />
}

export function OverlayWrapper(props: ComponentProps<'div'>) {
  const {className, ...rest} = props
  return <div {...rest} className={clsx(overlayWrapper, className)} />
}

export function TopRegionWrapper(props: RegionWrapperProps) {
  const {$debug, $margins, className, style, ...rest} = props

  return (
    <WithIntersection
      {...rest}
      className={clsx(topRegionWrapper[$debug ? 'debug' : 'default'], className)}
      style={{
        ...assignInlineVars({[topVar]: $margins ? `${$margins[0] - 1}px` : undefined}),
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
