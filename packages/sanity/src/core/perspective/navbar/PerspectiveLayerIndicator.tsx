import {Box} from '@sanity/ui'
import {forwardRef, type HTMLAttributes, type ReactNode} from 'react'

import {
  firstPosition,
  inRangeAfter,
  inRangeAfterDefault,
  inRangeMenuItem,
  labelIndicatorBase,
  labelIndicatorWithinRange,
  lastPosition,
  menuItemIndicatorBase,
} from './PerspectiveLayerIndicator.css'

export const GlobalPerspectiveMenuItemIndicator = forwardRef<
  HTMLDivElement,
  {
    $inRange: boolean
    $last: boolean
    $first: boolean
    $isDefaultPerspective: boolean
    children?: ReactNode
  } & HTMLAttributes<HTMLDivElement>
>(({$inRange, $last, $first, $isDefaultPerspective, children, className, ...rest}, ref) => {
  const classes = [
    menuItemIndicatorBase,
    $inRange ? inRangeMenuItem : '',
    $inRange && !$last ? ($isDefaultPerspective ? inRangeAfterDefault : inRangeAfter) : '',
    $first ? firstPosition : '',
    $last ? lastPosition : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes} ref={ref} {...rest}>
      {children}
    </div>
  )
})

GlobalPerspectiveMenuItemIndicator.displayName = 'GlobalPerspectiveMenuItemIndicator'

export const GlobalPerspectiveMenuLabelIndicator = forwardRef<
  HTMLDivElement,
  {
    $withinRange: boolean
    children?: ReactNode
  } & React.ComponentProps<typeof Box>
>(({$withinRange, children, className, ...rest}, ref) => {
  const classes = [
    labelIndicatorBase,
    $withinRange ? labelIndicatorWithinRange : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <Box className={classes} ref={ref} {...rest}>
      {children}
    </Box>
  )
})

GlobalPerspectiveMenuLabelIndicator.displayName = 'GlobalPerspectiveMenuLabelIndicator'
