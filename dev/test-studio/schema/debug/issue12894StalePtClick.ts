import {defineField, defineType} from 'sanity'

/**
 * Repro for https://github.com/sanity-io/sanity/issues/12894
 *
 * Bug: in Presentation / Visual Editing, after click-to-edit on a Portable Text
 * paragraph and then clicking another page element (title, image, etc.), the
 * original paragraph becomes unresponsive to clicks. The editor pane does not
 * refocus, the overlay highlight appears dimmer. If the PT has >1 block,
 * clicking any other paragraph "wakes" the first. With a single-block PT
 * there's no escape short of a page refresh.
 *
 * Prior art: confirmed and replicated by @rdunk on
 * https://github.com/sanity-io/visual-editing/issues/1557 (2024-11-12).
 *
 * Suspected routing path:
 *   - Page: `@sanity/visual-editing` overlay catches the click and posts a
 *     `visual-editing/focus` message via comlink.
 *   - Studio: `packages/sanity/src/presentation/PresentationTool.tsx` line ~213
 *     `comlink.on('visual-editing/focus', (data) => handleNavigate(...))`
 *   - Reverse: `useEffect` at line ~380 only posts `presentation/focus` when
 *     `params.id` or `params.path` change, so an identical re-focus is a no-op
 *     from the Studio side too.
 *
 * Repro steps:
 *   1. Run `pnpm dev`, open the Default workspace, create a new
 *      `Issue #12894: PT paragraph stale click in Presentation` document.
 *   2. Fill in title + cover image, and add ONE block to `content` (single-block PT).
 *   3. Open the Presentation tool, point it at a Visual Editing-enabled page
 *      rendering this document (any of the official Next.js templates works).
 *   4. Click the rendered PT paragraph on the page — editor focuses it (good).
 *   5. Click the title or the cover image — editor focuses that (good).
 *   6. Click the PT paragraph again — bug: editor does NOT refocus, overlay
 *      highlight appears dimmer.
 *   7. Add a second block to `content` and repeat steps 4-6: clicking the
 *      second block "wakes" the first.
 */
export const issue12894StalePtClick = defineType({
  name: 'issue12894StalePtClick',
  type: 'document',
  title: 'Issue #12894: PT paragraph stale click in Presentation',
  description:
    'Single-block Portable Text + title + image. Use to reproduce sanity-io/sanity#12894 (click-to-edit becomes unresponsive after switching focus).',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      title: 'Title',
      description: 'Click this from the page to test focus switching off the PT block.',
    }),
    defineField({
      name: 'cover',
      type: 'image',
      title: 'Cover image',
      description:
        'Click this from the page to test focus switching off the PT block. (User reported the same bug with images or any non-PT field.)',
    }),
    defineField({
      name: 'content',
      type: 'array',
      title: 'Content (single-block PT)',
      description:
        'Reproduce by leaving exactly ONE block in this field, then clicking it from the Presentation page, clicking the title or cover image, then trying to click the paragraph again.',
      of: [
        {
          type: 'block',
          // Plain blocks only — no inline annotations/decorators needed for the repro.
          styles: [{title: 'Normal', value: 'normal'}],
          marks: {decorators: [], annotations: []},
          lists: [],
        },
      ],
    }),
    defineField({
      name: 'secondaryContent',
      type: 'array',
      title: 'Secondary content (multi-block PT, for "wake" workaround)',
      description:
        'Optional. With >1 block, the user-discovered workaround is to click any other block to "wake" the field. Populate this with two blocks to demonstrate the workaround alongside the bug.',
      of: [
        {
          type: 'block',
          styles: [{title: 'Normal', value: 'normal'}],
          marks: {decorators: [], annotations: []},
          lists: [],
        },
      ],
    }),
  ],
  preview: {
    select: {title: 'title', media: 'cover'},
    prepare({title, media}) {
      return {title: title || 'Untitled #12894 repro', media}
    },
  },
})
