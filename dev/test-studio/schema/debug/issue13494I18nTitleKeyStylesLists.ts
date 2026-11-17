import {
  DEFAULT_BLOCK_STYLES,
  DEFAULT_LIST_TYPES,
  defineArrayMember,
  defineField,
  defineType,
} from 'sanity'

/**
 * Repro for https://github.com/sanity-io/sanity/issues/13494.
 *
 * Two problems:
 *
 *  1. Passing `i18nTitleKey` to `styles` and `lists` entries on a portable-text
 *     block used to produce schema validator errors:
 *
 *       Found unknown properties for style h1: "i18nTitleKey"
 *       Found unknown properties for list bullet: "i18nTitleKey"
 *
 *     (Decorators already allowed `i18nTitleKey`, which is why users saw the
 *     translated labels for those but not for styles/lists.)
 *
 *  2. `DEFAULT_BLOCK_STYLES` and `DEFAULT_LIST_TYPES` weren't re-exported from
 *     `sanity` / `@sanity/schema` the way `DEFAULT_ANNOTATIONS` and
 *     `DEFAULT_DECORATORS` are, so consumers couldn't spread the built-in
 *     translated entries.
 *
 * With the fix in place, this schema loads without validator errors, and
 * (with a locale plugin like @sanity/locale-fr-fr installed) the style and
 * list pickers render translated labels.
 */
export const issue13494I18nTitleKeyStylesLists = defineType({
  type: 'document',
  name: 'issue13494I18nTitleKeyStylesLists',
  title: 'Issue #13494 — i18nTitleKey on styles/lists',
  description:
    'Repro for #13494. The two portable-text fields below use the exported DEFAULT_BLOCK_STYLES / DEFAULT_LIST_TYPES (which carry i18nTitleKey on every entry). Before the fix this schema surfaces "Found unknown properties for style/list ..." in the schema-problems overlay; after the fix it loads cleanly.',
  fields: [
    defineField({
      type: 'string',
      name: 'title',
      title: 'Title',
    }),
    // Spread the built-in defaults directly, this is the pattern the issue
    // asks us to support.
    defineField({
      type: 'array',
      name: 'bodyDefaults',
      title: 'Body (spreads DEFAULT_BLOCK_STYLES / DEFAULT_LIST_TYPES)',
      of: [
        defineArrayMember({
          type: 'block',
          styles: [...DEFAULT_BLOCK_STYLES],
          lists: [...DEFAULT_LIST_TYPES],
        }),
      ],
    }),
    // Same content, but with an extra user-defined style and list, still using
    // i18nTitleKey on each entry (mirrors the snippet from the issue body).
    defineField({
      type: 'array',
      name: 'bodyDefaultsPlusCustom',
      title: 'Body (defaults + one custom style/list)',
      of: [
        defineArrayMember({
          type: 'block',
          styles: [
            ...DEFAULT_BLOCK_STYLES,
            {title: 'Lead', value: 'lead', i18nTitleKey: 'inputs.portable-text.style.lead'},
          ],
          lists: [
            ...DEFAULT_LIST_TYPES,
            {title: 'Todo', value: 'todo', i18nTitleKey: 'inputs.portable-text.list-type.todo'},
          ],
        }),
      ],
    }),
  ],
})
