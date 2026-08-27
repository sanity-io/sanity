import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {PopoverStackingStory} from './PopoverStackingStory'

describe('Portable Text Input', () => {
  describe('Edit popover stacking', () => {
    // Text blocks paint with `mix-blend-mode`, and edit popovers portal outside
    // `[data-wrapper]`. Blending is only contained by an isolation group, so
    // without one the blended text composites over the popover even though DOM
    // hit-testing puts the popover on top (SAPP-4408). Pixel-level proof lives in
    // the `Popover Stacking/OpenEditPopover` Chromatic story; this asserts the
    // isolation boundary that makes it work is still in place.
    it('Contains blended editor content in its own isolation group', async () => {
      void render(<PopoverStackingStory withOpenEditPopover />)

      await expect.element(page.getByTestId('popover-edit-dialog')).toBeVisible()

      const wrapper = document.querySelector('[data-wrapper]')
      const textBlock = document.querySelector('[data-testid="text-block__text"]')

      expect(getComputedStyle(textBlock!).mixBlendMode).toBe('multiply')
      expect(getComputedStyle(wrapper!).isolation).toBe('isolate')
    })
  })
})
