/* oxlint-disable no-restricted-imports */
import {Popover as UIPopover, type PopoverProps as UIPopoverProps} from '@sanity/ui/popover'
import {type HTMLProps, type RefAttributes} from 'react'

import {useOverlayContentMounted} from '../hooks/useOverlayContentMounted'

/** @internal */
export type PopoverProps = UIPopoverProps

/**
 * Customized Sanity UI <Popover> that defaults to `animate=true`
 *
 * All Popovers in the studio should be animated by default
 * Can be overridden when nesting popovers to prevent AnimatePresence conflicts
 *
 * The `content` is only rendered while the popover is open (plus the exit animation). Sanity UI
 * v4 otherwise keeps it mounted in a hidden `<Activity>`, and a form with many fields and array
 * items carries thousands of hidden DOM nodes that way.
 *
 * @internal
 */
export function Popover(
  props: PopoverProps &
    Omit<HTMLProps<HTMLDivElement>, 'as' | 'children' | 'content' | 'width'> &
    RefAttributes<HTMLDivElement>,
) {
  const {ref, animate = true, content, open, ...restProps} = props
  const contentMounted = useOverlayContentMounted(Boolean(open))

  return (
    <UIPopover
      {...restProps}
      animate={animate}
      content={contentMounted ? content : null}
      open={open}
      ref={ref}
    />
  )
}
