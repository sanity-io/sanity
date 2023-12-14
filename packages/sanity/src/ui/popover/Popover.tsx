/* eslint-disable no-restricted-imports */
import {Popover as UIPopover, PopoverProps as UIPopoverProps} from '@sanity/ui'
import React, {forwardRef} from 'react'

/** @internal */
export type PopoverProps = Omit<UIPopoverProps, 'animate'>

/**
 * Customized Sanity UI <Popover> that forces `animate=true`
 *
 * All Popovers in the studio should be animated.
 *
 * @internal
 */
export const Popover = forwardRef(function Popover(
  props: PopoverProps &
    Omit<React.HTMLProps<HTMLDivElement>, 'as' | 'children' | 'content' | 'width'>,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  return <UIPopover {...props} animate ref={ref} />
})
