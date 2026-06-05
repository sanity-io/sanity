import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'

import {testHelpers} from '../../../../../../test/browser/testHelpers'
import {RenderPipelineStory} from './RenderPipelineStory'

/**
 * Pins the `components.portableText.enableContainers` switch at the DOM level:
 * unset (the default) keeps emitting the Slate-named attributes, while `true`
 * emits only the PT-native `data-pt-*` attributes (the clean break that
 * unlocks container plugins). This is the contract the whole gating design
 * hinges on, so it is asserted directly on the rendered editor.
 */
describe('Portable Text Input', () => {
  describe('enableContainers', () => {
    it('unset (default) emits the Slate-named DOM attributes', async () => {
      const {getFocusedPortableTextEditor} = testHelpers()
      void render(<RenderPipelineStory />)

      const editor = (await getFocusedPortableTextEditor('field-body')).element()

      expect(editor.querySelector('[data-slate-string]')).not.toBeNull()
      expect(editor.querySelector('[data-pt-text]')).not.toBeNull()
    })

    it('enabled emits only PT-native data-pt-* attributes, no data-slate-*', async () => {
      const {getFocusedPortableTextEditor} = testHelpers()
      void render(<RenderPipelineStory enableContainers />)

      const editor = (await getFocusedPortableTextEditor('field-body')).element()

      expect(editor.querySelector('[data-pt-text]')).not.toBeNull()
      expect(editor.querySelector('[data-slate-string]')).toBeNull()
    })

    // Block objects are draggable in both pipelines. The legacy pipeline gets a
    // `draggable` wrapper from the engine's void render; the `pt-native`
    // catch-all has to reproduce it, or the editable never sees a `dragstart`.
    it.each([false, true] as const)(
      'enableContainers=%s renders block objects inside a draggable wrapper',
      async (enableContainers) => {
        const {getFocusedPortableTextEditor} = testHelpers()
        void render(<RenderPipelineStory enableContainers={enableContainers} />)

        const editor = (await getFocusedPortableTextEditor('field-body')).element()
        const blockObject = editor.querySelector('[data-testid="pte-block-object"]')

        expect(blockObject).not.toBeNull()
        expect(blockObject?.closest('[draggable="true"]')).not.toBeNull()
      },
    )

    // Same contract for inline objects: the `pt-native` catch-all reproduces the
    // engine's draggable inline wrapper that the legacy pipeline provides.
    it.each([false, true] as const)(
      'enableContainers=%s renders inline objects inside a draggable wrapper',
      async (enableContainers) => {
        const {getFocusedPortableTextEditor} = testHelpers()
        void render(<RenderPipelineStory enableContainers={enableContainers} />)

        const editor = (await getFocusedPortableTextEditor('field-body')).element()
        const inlineObject = editor.querySelector('[data-pt-inline="object"]')

        expect(inlineObject).not.toBeNull()
        expect(inlineObject?.querySelector('[draggable="true"]')).not.toBeNull()
      },
    )
  })
})
