import {CheckmarkIcon} from '@sanity/icons/Checkmark'
import {type ComponentProps} from 'react'

/**
 * A checkmark that takes up the icon slot without showing, so a toggle row that is off lines its
 * text up with the rows around it. The menu item's `Icon` sizes the svg through the props it
 * passes, so they are forwarded: without them the svg fell back to its intrinsic size, and the
 * row grew taller with its text pushed right.
 */
export function HiddenCheckmarkIcon(props: ComponentProps<typeof CheckmarkIcon>) {
  return <CheckmarkIcon {...props} style={{...props.style, visibility: 'hidden'}} />
}
