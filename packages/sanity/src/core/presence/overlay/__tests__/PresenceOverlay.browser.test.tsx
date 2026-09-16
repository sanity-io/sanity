import {describe, expect, test} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {MAX_AVATARS_DOCK, SLIDE_RIGHT_THRESHOLD_TOP} from '../../constants'
import {calcAvatarStackWidth} from '../../utils'
import {PresenceOverlayStory, presenceOn, SCROLLPORT_HEIGHT} from './PresenceOverlayStory'

// The overlay layer is the only parent shared by the docks and the in-flow items, and it carries no
// test id. The docks do carry `data-dock`, so the layer is reachable through one of them.
function overlayLayer(): HTMLElement {
  const dock = document.querySelector('[data-dock="top"]')
  if (!dock?.parentElement) throw new Error('presence overlay layer not rendered')
  return dock.parentElement
}

// In-flow items are the only absolutely positioned children of the layer: the docks are sticky and
// the spacers are in normal flow.
function inFlowItems(): HTMLElement[] {
  return Array.from(overlayLayer().children).filter(
    (child): child is HTMLElement =>
      child instanceof HTMLElement && getComputedStyle(child).position === 'absolute',
  )
}

function scroller(): HTMLElement {
  return page.getByTestId('document-panel-scroller').element() as HTMLElement
}

// The slot the field header reserves for presence, to the left of the field actions.
function reservedSlotOrNull(): HTMLElement | null {
  return document.querySelector('[data-ui="PresenceBox"]')
}

function reservedSlot(): HTMLElement {
  const slot = reservedSlotOrNull()
  if (!slot) throw new Error('presence box not rendered')
  return slot
}

function avatars(root: HTMLElement | undefined): HTMLElement[] {
  return Array.from(root?.querySelectorAll<HTMLElement>('[data-ui="Avatar"]') ?? [])
}

// The "+N" chip an unstacked group replaces with the hidden avatars themselves.
function counters(root: HTMLElement | undefined): HTMLElement[] {
  return Array.from(root?.querySelectorAll<HTMLElement>('[data-ui="AvatarCounter"]') ?? [])
}

function settle(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 100))
}

// Scrolls so the reserved slot's top edge sits `offset` pixels below the scrollport's top edge.
// Derived from live rects because absolute coordinates depend on the pane chrome around the form.
function placeSlotBelowTop(offset: number) {
  const target = scroller().getBoundingClientRect().top + offset
  scroller().scrollBy({
    top: reservedSlot().getBoundingClientRect().top - target,
    behavior: 'instant',
  })
}

describe('PresenceOverlay', () => {
  test('keeps the in-flow avatar in its reserved slot at every distance from the top edge', async () => {
    void render(<PresenceOverlayStory presence={presenceOn('title', ['a'])} />)

    await expect.poll(() => inFlowItems()).toHaveLength(1)

    // Sweeps the band where the overlay treats the field as near the edge. Docking the avatar or
    // sliding it toward the field actions both show up here as a horizontal jump.
    for (let offset = 60; offset >= 0; offset -= 4) {
      placeSlotBelowTop(offset)
      await settle()

      const items = inFlowItems()
      if (items.length === 0) {
        continue
      }

      const slotLeft = reservedSlot().getBoundingClientRect().left
      expect(
        Math.abs(items[0].getBoundingClientRect().left - slotLeft),
        `in-flow avatar left the reserved slot with its top ${offset}px below the scrollport`,
      ).toBeLessThanOrEqual(1)
    }
  })

  test('repaints when the collaborator count changes, without a scroll', async () => {
    const {rerender} = await render(<PresenceOverlayStory presence={presenceOn('title', ['a'])} />)

    await expect.poll(() => avatars(inFlowItems()[0])).toHaveLength(1)

    void rerender(<PresenceOverlayStory presence={presenceOn('title', ['a', 'b'])} />)
    await expect.poll(() => avatars(inFlowItems()[0])).toHaveLength(2)

    void rerender(<PresenceOverlayStory presence={[]} />)
    await expect.poll(() => inFlowItems()).toHaveLength(0)
  })

  test('unstacks the group at either scroll edge and stacks it in between', async () => {
    const collaborators = ['a', 'b', 'c', 'd', 'e', 'f']
    // A filler field, so the group can be placed anywhere in the scrollport - the title field
    // starts at the top edge and cannot be scrolled further down.
    void render(<PresenceOverlayStory presence={presenceOn('filler5', collaborators)} />)

    await expect.poll(() => reservedSlotOrNull()).toBeTruthy()
    await settle()

    placeSlotBelowTop(SCROLLPORT_HEIGHT / 2)
    await settle()
    expect(avatars(inFlowItems()[0]).length).toBeLessThan(collaborators.length)
    expect(counters(inFlowItems()[0])).toHaveLength(1)

    placeSlotBelowTop(SLIDE_RIGHT_THRESHOLD_TOP)
    await settle()
    expect(avatars(inFlowItems()[0])).toHaveLength(collaborators.length)
    expect(counters(inFlowItems()[0])).toHaveLength(0)

    // Inside the bottom band, and still short of the distance at which the group docks.
    placeSlotBelowTop(SCROLLPORT_HEIGHT - 40)
    await settle()
    expect(avatars(inFlowItems()[0])).toHaveLength(collaborators.length)
    expect(counters(inFlowItems()[0])).toHaveLength(0)
  })

  test('keeps a full stack inside the width the field header reserves for it', async () => {
    void render(
      <PresenceOverlayStory presence={presenceOn('title', ['a', 'b', 'c', 'd', 'e', 'f'])} />,
    )

    await expect.poll(() => inFlowItems()).toHaveLength(1)

    const item = inFlowItems()[0].getBoundingClientRect()
    const slot = reservedSlot().getBoundingClientRect()

    expect(Math.abs(item.left - slot.left)).toBeLessThanOrEqual(1)
    expect(item.width).toBeLessThanOrEqual(calcAvatarStackWidth(MAX_AVATARS_DOCK + 1))
  })
})
