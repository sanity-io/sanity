import {clsx} from 'clsx'
import {type ComponentProps} from 'react'
import {Box} from 'ui5'

import {
  menuItemIndicator,
  menuItemIndicatorFirst,
  menuItemIndicatorInRange,
  menuItemIndicatorInRangeTail,
  menuItemIndicatorLast,
  menuLabelIndicator,
  menuLabelIndicatorWithinRange,
} from './PerspectiveLayerIndicator.css'

export function GlobalPerspectiveMenuItemIndicator(
  props: ComponentProps<'div'> & {
    $inRange: boolean
    $last: boolean
    $first: boolean
    $isDefaultPerspective: boolean
  },
) {
  const {$inRange, $last, $first, $isDefaultPerspective, className, ...rest} = props

  return (
    <div
      {...rest}
      className={clsx(
        menuItemIndicator,
        $inRange &&
          !$last &&
          menuItemIndicatorInRangeTail[$isDefaultPerspective ? 'default' : 'other'],
        $inRange && menuItemIndicatorInRange,
        $first && menuItemIndicatorFirst,
        $last && menuItemIndicatorLast,
        className,
      )}
    />
  )
}

export function GlobalPerspectiveMenuLabelIndicator(
  props: ComponentProps<typeof Box> & {$withinRange: boolean},
) {
  const {$withinRange, className, ...rest} = props

  return (
    <Box
      {...rest}
      className={clsx(menuLabelIndicator, $withinRange && menuLabelIndicatorWithinRange, className)}
    />
  )
}
