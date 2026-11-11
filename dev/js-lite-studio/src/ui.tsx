/** Small pieces of UI that several parts of the studio share. */
import {useClickOutsideEvent, useGlobalKeyDown} from '@sanity/ui'
import {type CSSProperties} from 'react'

export type Tone =
  | 'default'
  | 'neutral'
  | 'primary'
  | 'suggest'
  | 'positive'
  | 'caution'
  | 'critical'

/** Closes a popover on a click outside `elements` and on Escape, like the Rust studio's popovers. */
export function useDismiss(
  open: boolean,
  close: () => void,
  elements: () => (HTMLElement | null)[],
): void {
  useClickOutsideEvent(open ? close : undefined, elements)
  useGlobalKeyDown((event) => {
    if (open && event.key === 'Escape') close()
  })
}

/** Wraps the element a popover opens from, like the Rust studio's popovers do: a card used as a
 * button stretches to the width of its container. */
export const POPOVER_ANCHOR: CSSProperties = {
  display: 'inline-block',
  position: 'relative',
  maxWidth: '100%',
}

/** The dot a release is marked with, in its tone. */
export function ReleaseDot(props: {tone: Tone}) {
  const style: CSSProperties = {
    display: 'inline-block',
    width: 9,
    height: 9,
    borderRadius: '50%',
    flex: 'none',
    backgroundColor: `var(--card-badge-${props.tone}-dot-color)`,
  }
  return <span data-ui="ReleaseAvatar" style={style} />
}
