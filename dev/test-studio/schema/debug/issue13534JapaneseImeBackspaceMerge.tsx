import {defineArrayMember, defineField, defineType} from 'sanity'

/**
 * Reproduction for https://github.com/sanity-io/sanity/issues/13534
 *
 * Backspace at the start of a paragraph block, following a Japanese IME
 * composition in the previous block, deletes the last character of the
 * previous block instead of cleanly merging the two blocks.
 *
 * The bug lives upstream in `@portabletext/editor` (extracted from this
 * monorepo). Suspected root cause: race between the tail end of a
 * `compositionend` on the previous block and the `beforeinput` /
 * `deleteContentBackward` that Slate turns into a block-merge. The final
 * composed IME character isn't yet committed to the editor value when the
 * merge fires, so the merge captures a pre-commit snapshot and the last
 * char is lost.
 *
 * The reporter is on sanity 3.99.0 (pins @portabletext/editor ^1.57.5).
 * Latest editor as of writing is ^7.10.11 with an in-flight input-pipeline
 * rewrite (PRs portabletext/editor#2276, #2814). Worth verifying on latest
 * before filing upstream, in case newer versions already fix it.
 *
 * REQUIRED: An OS-level Japanese IME. On Windows: Microsoft IME.
 * On macOS: Kotoeri (built-in) or Google Japanese Input.
 * The characters MUST go through IME composition (romaji → kana → kanji
 * commit). Pasting the text will not reproduce the bug.
 *
 * Steps (from the issue, https://github.com/sanity-io/sanity/issues/13534):
 *   1. Enable the Japanese IME at the OS level.
 *   2. Create a new "Issue 13534: Japanese IME backspace merge" document.
 *   3. In the Body field's first paragraph, type クロスボーダー・
 *      via IME composition (kurosubodaa + convert + commit, then the ・
 *      full-width middle dot).
 *   4. Press Enter to create a second paragraph.
 *   5. In the second paragraph, type コンサルティング via IME composition.
 *   6. Place the caret immediately before コ (start of second block).
 *   7. Press Backspace to merge.
 *
 *   Expected: single paragraph reading クロスボーダー・コンサルティング.
 *   Actual: the last character of the first block is dropped, e.g.
 *           クロスボーダコンサルティング.
 */
export const issue13534JapaneseImeBackspaceMerge = defineType({
  name: 'issue13534JapaneseImeBackspaceMerge',
  type: 'document',
  title: 'Issue 13534: Japanese IME backspace merge',
  description:
    'Repro for https://github.com/sanity-io/sanity/issues/13534. Requires an OS-level Japanese IME. See the file header for the full step-by-step recipe.',
  fields: [
    defineField({
      name: 'body',
      title: 'Body',
      description:
        'Two paragraphs. (1) Type クロスボーダー・ via IME. (2) Enter. (3) Type コンサルティング via IME. (4) Place caret before コ. (5) Backspace. Expected: クロスボーダー・コンサルティング. Actual: last char of block 1 is dropped.',
      type: 'array',
      of: [defineArrayMember({type: 'block'})],
    }),
  ],
})
