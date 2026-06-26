import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {testHelpers} from '../../../../../../test/browser/testHelpers'
import {LeafStabilityStory} from './LeafStabilityStory'

describe('Portable Text Input', () => {
  describe('Render stability', () => {
    // Toggling a style whose schema type has a custom `component` makes Studio's
    // `Style` render `CustomComponent` where it rendered `DefaultComponent`, so
    // React remounts the subtree and the editable leaf is a new node. That
    // remount is the churn the editor's focus restoration races (EDEX-1410). PTE
    // itself does not remount the leaf (portabletext/editor#2865); the swap is in
    // Studio's render and is inherent to a consumer `component` wrapping the
    // editable children.
    it('remounts the editable leaf when toggling a custom style component', async () => {
      const {getFocusedPortableTextEditor, insertPortableText} = testHelpers()
      void render(<LeafStabilityStory />)

      const $editor = await getFocusedPortableTextEditor('field-customStyle')
      await insertPortableText('foo', $editor)

      const leafBefore = $editor.element().querySelector('[data-pt-marks]')
      expect(leafBefore).not.toBeNull()

      // Toggle the custom Highlight style from the toolbar.
      const $field = page.getByTestId('field-customStyle')
      await $field.getByTestId('block-style-select').click()
      await page.getByRole('menu').getByText('Highlight', {exact: true}).click()

      // Wait for the custom style component to render.
      await expect.element(page.getByTestId('highlight-mark')).toBeInTheDocument()

      const leafAfter = $editor.element().querySelector('[data-pt-marks]')
      expect(leafAfter).not.toBe(leafBefore)
    })
  })
})
