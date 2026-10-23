import {type RefObject, useLayoutEffect, useState} from 'react'

/** Spare width the pills need before they come back up beside the actions, so a pane resized at the threshold does not flicker. */
const HYSTERESIS = 8

/**
 * PROPOSED (open beta, T2, Faheem 23 Oct): whether a host's pills take a row of their own below the header's actions. They do when the pane is
 * too narrow for the pills on one line beside the actions (Presentation's document pane, a split pane), so a group never breaks across lines
 * and nothing is hidden. Measured from the pills' own widths, not a breakpoint, so it holds for any set of pills and any pane.
 *
 * @internal
 */
export function usePillsRowBelow({
  enabled,
  headerRef,
  pillsRef,
  actionsRef,
  inset,
  gap,
}: {
  enabled: boolean
  headerRef: RefObject<HTMLElement | null>
  /** The scroller around the pills; the host's pill row is the one child of its document-perspective-list. */
  pillsRef: RefObject<HTMLElement | null>
  actionsRef: RefObject<HTMLElement | null>
  /** The scroller's padding, left and right together. */
  inset: number
  /** The header's gap between the pills and the actions. */
  gap: number
}): boolean {
  const [below, setBelow] = useState(false)

  useLayoutEffect(() => {
    const header = headerRef.current
    const scroller = pillsRef.current
    const actions = actionsRef.current
    if (!enabled || !header || !scroller || !actions) {
      setBelow(false)
      return undefined
    }

    // The width the pills take on one line: each child with its margins, and the row's gaps between them.
    const naturalWidth = () => {
      // The header's own list (document-perspective-list) holds the host's row as its one child.
      const list = scroller.querySelector<HTMLElement>('[data-testid="document-perspective-list"]')
      const row = (list?.firstElementChild ?? null) as HTMLElement | null
      if (!row) return 0
      const children = [...row.children] as HTMLElement[]
      const rowGap = parseFloat(getComputedStyle(row).columnGap) || 0
      const widths = children.map((child) => {
        const style = getComputedStyle(child)
        return child.offsetWidth + parseFloat(style.marginLeft) + parseFloat(style.marginRight)
      })
      return (
        widths.reduce((sum, width) => sum + width, 0) + rowGap * Math.max(0, children.length - 1)
      )
    }

    const measure = () => {
      const needed = naturalWidth() + inset + gap + actions.offsetWidth
      const available = header.clientWidth
      setBelow((current) => (current ? needed + HYSTERESIS > available : needed > available))
    }

    measure()
    const resize = new ResizeObserver(measure)
    resize.observe(header)
    resize.observe(actions)
    // A pill's text changes its width (a variant chosen, a count): measure again.
    const mutation = new MutationObserver(measure)
    mutation.observe(scroller, {childList: true, subtree: true, characterData: true})
    return () => {
      resize.disconnect()
      mutation.disconnect()
    }
  }, [enabled, headerRef, pillsRef, actionsRef, inset, gap])

  return below
}
