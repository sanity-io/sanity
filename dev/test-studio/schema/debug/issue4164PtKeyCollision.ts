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
 * `_key`. From the Feb 2025 console paste the collision has a very specific
 * shape:
 *
 *   {
 *     "_key": "...", "_type": "block",
 *     "children": [
 *       { "_key": "X", "_type": "span", "text": "<long text>" },
 *       { "_key": "X", "_type": "span", "text": "" }
 *     ]
 *   }
 *
 * Two span siblings share the same `_key`. Over time the long-text one loses
 * its text until both end up with `text: ""`. That shape maps to a span-split
 * (Enter / soft break / delete-at-boundary) producing a new span that inherits
 * the original span's `_key` instead of being assigned a fresh one.
 *
 * Triggers from the issue: rapid typing, deleting empty bullet points, pasting
 * large text, and (most strongly) editing the same document across multiple
 * Studio tabs at once. The reporter has been hitting this since 2023 on a
 * dataset originally converted from public to private.
 *
 * --- The two scenarios in this file ---
 *
 *   1. `issue4164PtKeyCollision` — portable text with a typical user-facing
 *      shape (lists, decorators, link annotation, inline `figure`, block-level
 *      object). This is the primary scenario: the duplicate-span-`_key`
 *      collision plus the "Non-unique keys" red banner that follows.
 *
 *   2. `issue4164TitleOnlyPublishRace` — a document with a single `string`
 *      title field. The reporter explicitly says the same wipe-on-publish
 *      symptom happens on a taxonomy doc with no portable text at all. This
 *      scenario probes whether the underlying bug is PT-bound or a broader
 *      publish-vs-draft mutation race. If the title-wipe reproduces, the bug
 *      surface is wider than the PT editor.
 *
 * --- Manual repro recipe (after `pnpm dev` on the test-studio) ---
 *
 * Scenario 1 — duplicate span `_key` in portable text
 *
 *   1. Create a new "Issue 4164: PT span _key collision" document.
 *   2. In the `body` field, type a paragraph quickly. Switch to bullet list,
 *      add a few items, delete the last (empty) one. Repeat.
 *   3. Paste a large chunk of text (~5–10 paragraphs) into the field.
 *   4. Position the cursor mid-span (inside an existing line of text), press
 *      Enter to split the block, then rapidly Backspace and retype. This is
 *      the edit shape that maps to the observed end-state from the issue.
 *   5. Open the same document in a second browser tab. Type in both tabs
 *      simultaneously inside the `body` field. In tab A keep typing rapidly;
 *      in tab B click Publish (or vice-versa) before the local debounce
 *      settles.
 *   6. Watch the devtools console for `Multiple spans have \`_key\`` warnings.
 *      Watch the field itself for the "Non-unique keys / Several items in
 *      this list share the same identifier (key). Generate unique keys" red
 *      banner — that's the user-facing surface of the same desync.
 *   7. While the broken state is on screen, open Vision in another tab and
 *      query the document directly:
 *        *[_id in [$draftId, $publishedId]]
 *      If the persisted state is intact and only the local Studio view is
 *      broken, that confirms the bug is in client-side patch application,
 *      not in the mutation pipeline going out. The reporter's "sometimes
 *      the issue resolves itself if I just wait" line points the same way:
 *      a fresh listener event from the server overwrites the broken local
 *      model.
 *
 * Scenario 2 — single-string field wiped on publish during rapid typing
 *
 *   1. Create a new "Issue 4164: title-only publish race" document.
 *   2. Type a title quickly.
 *   3. Click Publish before the local debounce settles (immediately after
 *      stopping typing — give it less than ~500ms).
 *   4. Observe whether the title field goes blank. Wait a few seconds — the
 *      reporter says it sometimes self-heals, sometimes you have to retype.
 *   5. Same Vision check as scenario 1: query the document and compare the
 *      persisted state to what the Studio shows.
 *
 * --- Notes for the maintainer running this ---
 *
 *   - `@portabletext/editor` is external (declared as `^6.6.4` in
 *     packages/sanity). The "Multiple spans have _key" string isn't in this
 *     repo. If the bug reproduces inside the editor, the failing-test work
 *     belongs in sanity-io/portabletext-editor. If only scenario 2 reproduces,
 *     the bug is in sanity's mutation/save pipeline and lives here.
 *   - The "`No such schema type: figure`" errors in the user's paste are a
 *     *separate* problem (their schema is missing a `figure` type that the
 *     diff renderer expects on old revisions). Don't chase that during this
 *     repro. We do declare a `figure` inline type here so the schema mirrors
 *     the user's setup, but ours is registered properly.
 *   - The history-misattribution symptom that @mckelveygreg described (diffs
 *     attributed to people who only viewed the doc) is most likely the same
 *     client/server desync surfacing in the history viewer. No need to repro
 *     it independently.
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

// Inline span-level object, named to mirror the reporter's actual schema
// (their content references a `figure` inline type).
const issue4164Figure = defineType({
  name: 'issue4164Figure',
  type: 'object',
  title: 'Figure (inline)',
  fields: [
    defineField({name: 'caption', type: 'string'}),
    defineField({name: 'src', type: 'string'}),
  ],
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
    'Repro for https://github.com/sanity-io/sanity/issues/4164 (scenario 1). ' +
    'Rapidly edit the body, create/delete empty bullet points, paste large text, ' +
    'split a span mid-text with Enter and retype, and open the same document in ' +
    'two tabs. Watch the console for "Multiple spans have _key" warnings, the ' +
    'field for the "Non-unique keys" banner, and the form state for reverts.',
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
          // bullet + numbered lists, common decorators, and a link
          // annotation.
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
            // Inline span-level `figure` — matches the user's setup.
            defineArrayMember({type: 'issue4164Figure'}),
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
      return {title: title || 'Untitled (#4164 repro · scenario 1)'}
    },
  },
})

// Scenario 2: single string field. Reporter says publish-during-rapid-typing
// wipes the title on a taxonomy doc with no PT involved at all. If this
// reproduces, the bug surface isn't PT-bound.
export const issue4164TitleOnlyPublishRace = defineType({
  name: 'issue4164TitleOnlyPublishRace',
  type: 'document',
  title: 'Issue 4164: title-only publish race',
  description:
    'Repro for https://github.com/sanity-io/sanity/issues/4164 (scenario 2). ' +
    'Create a new doc, type the title fast, click Publish before the local ' +
    'debounce settles. The reporter sees the title field wiped — sometimes ' +
    'self-heals, sometimes requires retyping. Probes whether the underlying ' +
    'bug is PT-bound or a broader publish-vs-draft mutation race.',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      title: 'Title',
    }),
  ],
  preview: {
    select: {title: 'title'},
    prepare({title}) {
      return {title: title || 'Untitled (#4164 repro · scenario 2)'}
    },
  },
})

// Hoisted types so they can be registered alongside the document types.
export const issue4164SupportingTypes = [issue4164LinkAnnotation, issue4164Figure, issue4164Callout]
