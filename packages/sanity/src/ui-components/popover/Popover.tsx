/* oxlint-disable no-restricted-imports */
import {Popover as UIPopover, type PopoverProps as UIPopoverProps} from '@sanity/ui/popover'
import {type HTMLProps, type RefAttributes} from 'react'

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
export function Popover(
  props: PopoverProps &
    Omit<HTMLProps<HTMLDivElement>, 'as' | 'children' | 'content' | 'width'> &
    RefAttributes<HTMLDivElement>,
) {
  const {ref, animate = true, ...restProps} = props
  return <UIPopover {...restProps} animate={animate} ref={ref} />
}
