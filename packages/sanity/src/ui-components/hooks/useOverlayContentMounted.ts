import {useEffect, useState} from 'react'

/**
 * How long closed overlay content stays mounted after `open` turns false. Covers the
 * `@sanity/ui` exit animation (a 0.2s spring that fades to `opacity: 0` first), so the
 * card still has its content while it animates out.
 *
 * @internal
 */
export const OVERLAY_EXIT_GRACE_MS = 500

/**
 * Tells a Studio overlay wrapper whether to render its `content`.
 *
 * `@sanity/ui` v4 keeps closed Popover / Tooltip / MenuButton content mounted inside a hidden
 * `<Activity>`. React still reconciles that subtree on every parent update and the browser keeps
 * its DOM, and in a large studio form that hidden chrome (field action menus, comment inputs,
 * insert menus and tooltips for every field and array item) is most of the DOM. The wrappers
 * therefore render content only while the overlay is open, plus {@link OVERLAY_EXIT_GRACE_MS}
 * after it closes so the exit animation has something to animate.
 *
 * @internal
 */
export function useOverlayContentMounted(open: boolean): boolean {
  const [prevOpen, setPrevOpen] = useState(open)
  const [lingering, setLingering] = useState(false)

  if (open !== prevOpen) {
    setPrevOpen(open)
    if (!open) setLingering(true)
  }

  useEffect(() => {
    if (open || !lingering) return undefined

    const timer = setTimeout(() => setLingering(false), OVERLAY_EXIT_GRACE_MS)

    return () => clearTimeout(timer)
  }, [open, lingering])

  return open || lingering
}
