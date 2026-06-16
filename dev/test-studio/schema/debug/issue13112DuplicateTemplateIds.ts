import {defineField, defineType} from 'sanity'

/**
 * Repro for https://github.com/sanity-io/sanity/issues/13112
 *
 * Minimal "post" + "page" schemas with a `language` field, used by the
 * `issue13112` workspace in this test studio's `sanity.config.ts`. That
 * workspace wires up `@sanity/document-internationalization` with
 * `addTemplates: true` AND a root `schema.templates` callback that
 * replaces the plugin's generated templates with same-ID custom ones —
 * the exact combination that produces duplicate template IDs in the
 * resolved registry.
 *
 * To reproduce in the studio:
 *   1. `pnpm dev`
 *   2. open http://localhost:3333/issue13112
 *   3. open "Posts (IS)" in the structure
 *   4. click the + button
 *
 * Expected: a new `issue13112Post` document is created.
 * Actual (on `main`): a new `issue13112Page` document is created
 *   (because the plugin's `page-is` template, contributed via
 *   `[...prev, ...staticTemplates]`, sits in the resolved templates
 *   array with the same id as the root config's `post-is` template
 *   in some merge orderings; in others the wrong-type
 *   plugin-contributed entry for `post-is` itself wins
 *   `templates.find(t => t.id === 'issue13112Post-is')`).
 */

export const issue13112Post = defineType({
  name: 'issue13112Post',
  type: 'document',
  title: 'Issue 13112 (Post)',
  fields: [
    defineField({name: 'title', type: 'string'}),
    defineField({
      name: 'language',
      type: 'string',
      readOnly: true,
      hidden: true,
    }),
  ],
})

export const issue13112Page = defineType({
  name: 'issue13112Page',
  type: 'document',
  title: 'Issue 13112 (Page)',
  fields: [
    defineField({name: 'title', type: 'string'}),
    defineField({
      name: 'language',
      type: 'string',
      readOnly: true,
      hidden: true,
    }),
  ],
})
