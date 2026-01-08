/* eslint-disable no-restricted-imports */
import {Popover as UIPopover, type PopoverProps as UIPopoverProps} from '@sanity/ui'
import {type ForwardedRef, forwardRef, type HTMLProps} from 'react'

/** @internal */
export type PopoverProps = UIPopoverProps

/**
 * Customized Sanity UI <Popover> that defaults to `animate=true`
 *
 * All Popovers in the studio should be animated by default
 * Can be overridden when nesting popovers to prevent AnimatePresence conflicts
 *
 * @internal
 */
export const Popover = forwardRef(function Popover(
  props: PopoverProps & Omit<HTMLProps<HTMLDivElement>, 'as' | 'children' | 'content' | 'width'>,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const {animate = true, ...restProps} = props
  return <UIPopover {...restProps} animate={animate} ref={ref} />
})
