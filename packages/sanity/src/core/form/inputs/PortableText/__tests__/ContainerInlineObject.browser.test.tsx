import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {testHelpers} from '../../../../../../test/browser/testHelpers'
import {ContainerInlineObjectStory} from './ContainerInlineObjectStory'

describe('Portable Text Input', () => {
  describe('containers', () => {
    // An inline object living inside a container cell must be editable just like
    // one at the array root: double-clicking it opens the edit dialog. That only
    // works if the catch-all `renderInlineObject` resolves the form member item
    // for the inline object's deep (container-nested) path.
    it('opens the edit dialog for an inline object nested in a container cell', async () => {
      const {getFocusedPortableTextEditor} = testHelpers()
      void render(<ContainerInlineObjectStory />)

      const editor = (await getFocusedPortableTextEditor('field-body')).element()
      const inlineObject = editor.querySelector('[data-pt-inline="object"]')

      expect(inlineObject).not.toBeNull()

      await userEvent.dblClick(inlineObject as HTMLElement)

      await expect.element(page.getByTestId('popover-edit-dialog')).toBeVisible()
    })
  })
})
