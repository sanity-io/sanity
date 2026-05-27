import {defineArrayMember, defineField, defineType} from 'sanity'

/**
 * Reproduction scaffold for https://github.com/sanity-io/sanity/issues/4164
 *
 * The reporter sees portable text content reverting / duplicating / disappearing
 * mid-edit, with devtools warnings like:
 *
 *   Multiple spans have `_key` <hash>. It's ambiguous which one to update/remove.
 *
 * The warning is emitted from inside @portabletext/editor when the editor's
 * internal model contains two span children of the same block with the same
 * `_key`. It correlates with: rapid typing, deleting empty bullet points,
 * pasting large chunks of text, and (most strongly) editing the same document
 * across multiple Studio tabs at once.
 *
 * This debug document mirrors the user's setup as closely as the issue body
 * describes it: a portable text array with bullet/numbered lists, a small set
 * of decorators and annotations, an inline span object, and a block-level
 * object (the "array of objects" the reporter mentions).
 *
 * How to drive the repro (after `pnpm dev` on the test-studio):
 *
 *   1. Create a new document of type "Issue 4164: PT span _key collision".
 *   2. In the `body` field, type a paragraph, switch to a bullet list, add
 *      a few items, then delete the last (empty) bullet. Repeat quickly.
 *   3. Paste a large chunk of text (~5-10 paragraphs) into the field.
 *   4. Open the same document in a second browser tab. Type in both tabs
 *      simultaneously inside the `body` field.
 *   5. Watch the devtools console for `Multiple spans have \`_key\`` warnings
 *      and the form state for content reverting / duplicating.
 *
 * If you don't see it on the first try: keep going. The reporter has been
 * hitting this since 2023 and notes it's timing-sensitive. The two-tab case
 * is the most reliable trigger in their description.
 */

const issue4164LinkAnnotation = defineType({
  name: 'issue4164Link',
  type: 'object',
  title: 'Link',
  fields: [
    defineField({
      name: 'href',
      type: 'url',
      validation: (Rule) => Rule.uri({scheme: ['http', 'https', 'mailto', 'tel']}),
    }),
  ],
})

const issue4164InlineBadge = defineType({
  name: 'issue4164InlineBadge',
  type: 'object',
  title: 'Inline badge',
  fields: [defineField({name: 'label', type: 'string'})],
})

const issue4164Callout = defineType({
  name: 'issue4164Callout',
  type: 'object',
  title: 'Callout (block-level object)',
  fields: [defineField({name: 'title', type: 'string'}), defineField({name: 'body', type: 'text'})],
})

export const issue4164PtKeyCollision = defineType({
  name: 'issue4164PtKeyCollision',
  type: 'document',
  title: 'Issue 4164: PT span _key collision',
  description:
    'Repro for https://github.com/sanity-io/sanity/issues/4164. ' +
    'Rapidly edit the body, create/delete empty bullet points, paste large text, ' +
    'and open the same document in two tabs. Watch the console for ' +
    '"Multiple spans have _key" warnings and the form state for reverts.',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      title: 'Title',
    }),
    defineField({
      name: 'body',
      type: 'array',
      title: 'Body (portable text)',
      of: [
        defineArrayMember({
          type: 'block',
          // Mirror a typical user-facing PT field: a handful of styles,
          // bullet + numbered lists, common decorators, and a couple of
          // annotations (one link, one custom inline object via marks).
          styles: [
            {title: 'Normal', value: 'normal'},
            {title: 'Heading 2', value: 'h2'},
            {title: 'Heading 3', value: 'h3'},
            {title: 'Quote', value: 'blockquote'},
          ],
          lists: [
            {title: 'Bullet', value: 'bullet'},
            {title: 'Numbered', value: 'number'},
          ],
          marks: {
            decorators: [
              {title: 'Strong', value: 'strong'},
              {title: 'Emphasis', value: 'em'},
              {title: 'Code', value: 'code'},
              {title: 'Underline', value: 'underline'},
            ],
            annotations: [issue4164LinkAnnotation],
          },
          of: [
            // Inline span-level object, so the block's `children` array has
            // a mix of span and non-span entries (matches the user's setup
            // where inline objects sit alongside text spans).
            defineArrayMember({type: 'issue4164InlineBadge'}),
          ],
        }),
        // Block-level object — the "array of objects" the reporter mentions
        // in their EDIT note.
        defineArrayMember({type: 'issue4164Callout'}),
      ],
    }),
  ],
  preview: {
    select: {title: 'title'},
    prepare({title}) {
      return {title: title || 'Untitled (#4164 repro)'}
    },
  },
})

// Hoisted types so they can be registered alongside the document type.
export const issue4164SupportingTypes = [
  issue4164LinkAnnotation,
  issue4164InlineBadge,
  issue4164Callout,
]
