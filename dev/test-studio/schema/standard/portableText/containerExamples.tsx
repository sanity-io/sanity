import {defineArrayMember, defineField, defineType} from 'sanity'

import {StructuredListsPlugins} from './structuredLists'

/********************
 * Example: Structured lists
 *
 * Lists as containers (`list` → `items` → `list-item` → `content`): items
 * hold text blocks, images, and nested lists, which the flat
 * `listItem`/`level` model cannot express. The item shape matches what
 * `@portabletext/markdown` emits for structural lists (`types.list`), so
 * converted markdown drops straight into this schema.
 ********************/

export const structuredListItem = defineType({
  name: 'list-item',
  title: 'List item',
  type: 'object',
  preview: {
    select: {content: 'content'},
    prepare({content}) {
      const blockCount = Array.isArray(content) ? content.length : 0
      return {title: `List item (${blockCount} block${blockCount === 1 ? '' : 's'})`}
    },
  },
  fields: [
    defineField({
      name: 'content',
      title: 'Content',
      type: 'array',
      of: [
        defineArrayMember({
          // Flat lists are disabled: structured lists are this field's
          // only list model, and an empty `lists` also disables the
          // built-in markdown list shortcuts that would race the
          // structured-list input rule on the same markers.
          type: 'block',
          lists: [],
        }),
        defineArrayMember({
          type: 'image',
          fields: [defineField({name: 'alt', type: 'string', title: 'Alternative text'})],
        }),
        // Nested lists are just lists inside an item's content.
        defineArrayMember({type: 'list'}),
      ],
    }),
  ],
})

export const structuredList = defineType({
  name: 'list',
  title: 'List',
  type: 'object',
  preview: {
    select: {kind: 'kind', items: 'items'},
    prepare({kind, items}) {
      const itemCount = Array.isArray(items) ? items.length : 0
      return {title: `${kind ?? 'bullet'} list (${itemCount} item${itemCount === 1 ? '' : 's'})`}
    },
  },
  fields: [
    defineField({
      name: 'kind',
      title: 'Kind',
      type: 'string',
      initialValue: 'bullet',
      options: {list: ['bullet', 'number']},
    }),
    defineField({
      name: 'items',
      title: 'Items',
      type: 'array',
      of: [defineArrayMember({type: 'list-item'})],
    }),
  ],
})

const structuredListsField = defineField({
  type: 'array',
  name: 'structuredLists',
  title: 'Structured lists',
  description:
    'Lists as containers (list > list-item > content). Items hold text blocks, images, and nested lists, which the flat listItem/level model cannot express.',
  of: [
    defineArrayMember({
      // Flat lists are disabled: structured lists are this field's
      // only list model, and an empty `lists` also disables the
      // built-in markdown list shortcuts that would race the
      // structured-list input rule on the same markers.
      type: 'block',
      lists: [],
    }),
    defineArrayMember({
      type: 'image',
      fields: [defineField({name: 'alt', type: 'string', title: 'Alternative text'})],
    }),
    defineArrayMember({type: 'list'}),
  ],
  components: {
    portableText: {
      plugins: StructuredListsPlugins,
    },
  },
})

/********************
 * The document
 *
 * One field per container example. A new example brings its own plugin
 * file (rendering and editing) and its own schema section above, then
 * adds its field here; nothing is shared between examples.
 ********************/

export const containerExamples = defineType({
  name: 'containerExamples',
  title: 'Container Examples',
  type: 'document',
  fields: [
    defineField({name: 'title', type: 'string', title: 'Title'}),
    defineField({
      type: 'boolean',
      name: 'containersEnabled',
      title: 'Render containers inline',
      description:
        'When off, the Structured lists field renders `list` blocks as block objects edited through the dialog. Author content in one mode and toggle to verify the same data works in the other.',
      initialValue: true,
    }),
    structuredListsField,
  ],
})
