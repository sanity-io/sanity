import {defineContainer} from '@portabletext/editor'
import {defineBehavior} from '@portabletext/editor/behaviors'
import {BehaviorPlugin} from '@portabletext/editor/plugins'
import {getFocusBlock} from '@portabletext/editor/selectors'
import {defineArrayMember, defineField, defineType, type PortableTextPluginsProps} from 'sanity'

import {StandaloneTableInput} from './StandaloneTableInput'

/**
 * POC: a standalone table field, a Portable Text array constrained to a
 * single table block, edited through the built-in table plugin with the
 * writing-surface chrome stripped (see `StandaloneTableInput`). The demo
 * document pairs every placement with `sanity-plugin-rich-table`'s
 * equivalent configuration for side-by-side comparison: object storage
 * with a custom table UI versus Portable Text storage with the disguised
 * built-in editor.
 */
// The text config for table cells. The root block member of every
// standalone table field mirrors it exactly: toolbar membership is
// root-derived, so this single object decides both what cells accept and
// what the toolbar offers.
const tableTextMemberConfig = {
  lists: [
    {title: 'Bulleted list', value: 'bullet'},
    {title: 'Numbered list', value: 'number'},
  ],
  marks: {
    decorators: [
      {title: 'Strong', value: 'strong'},
      {title: 'Emphasis', value: 'em'},
      {title: 'Code', value: 'code'},
      {title: 'Underline', value: 'underline'},
      {title: 'Strike', value: 'strike-through'},
    ],
    annotations: [
      {
        type: 'object',
        name: 'link',
        title: 'Link',
        fields: [{type: 'url', name: 'href', title: 'URL'}],
      },
    ],
  },
} as const

const standaloneTableContainers = {
  table: defineContainer({type: 'standaloneTable', arrayField: 'rows'}),
  row: defineContainer({type: 'row', arrayField: 'cells'}),
  cell: defineContainer({type: 'cell', arrayField: 'value'}),
}

// The field holds exactly one block, the table. Root-level inserts and
// breaks would mint siblings (the container edge-escape raises a root
// insert when Enter is pressed at the table's boundary), so both are
// denied at root; everything inside cells passes through untouched. An
// owning behavior with no actions swallows the event.
const oneBlockBehaviors = [
  defineBehavior({
    on: 'insert.block',
    guard: ({snapshot, event}) => {
      const atRoot = event.at
        ? event.at.anchor.path.length === 1
        : (getFocusBlock(snapshot)?.path.length ?? 1) === 1
      return atRoot
    },
    actions: [],
  }),
  defineBehavior({
    on: 'insert.break',
    guard: ({snapshot}) => (getFocusBlock(snapshot)?.path.length ?? 0) === 1,
    actions: [],
  }),
  // The table itself is not deletable from inside the editor: denying
  // root-level `delete.block` covers the table menu's delete action,
  // select-all Backspace (the engine decomposes fully covered blocks into
  // `delete.block`), and programmatic deletes, while deletion inside
  // cells (deeper paths) passes through. Clearing the field stays
  // possible through the field menu, which bypasses the editor.
  defineBehavior({
    on: 'delete.block',
    guard: ({event}) => event.at.length === 1,
    actions: [],
  }),
]

// Binds the table plugin to the `standaloneTable` shape; used by every
// field that carries the type, standalone or embedded.
function TableContainersPlugins(props: PortableTextPluginsProps) {
  return props.renderDefault({
    ...props,
    plugins: {
      ...props.plugins,
      table: {enabled: true, containers: standaloneTableContainers},
    },
  })
}

// The standalone field additionally enforces the one-table invariant.
// The embedded body field must NOT use this: denying root inserts and
// breaks would break ordinary writing there.
function StandaloneTablePlugins(props: PortableTextPluginsProps) {
  return (
    <>
      <TableContainersPlugins {...props} />
      <BehaviorPlugin behaviors={oneBlockBehaviors} />
    </>
  )
}

// Rich-table's cells mirror ours: the same text config plus images,
// passed to `richTablePlugin` via `portableTextSchemaTypeName` so the
// side-by-side comparison differs only in architecture, not in schema
// generosity.
export const tableCellContent = defineType({
  type: 'array',
  name: 'tableCellContent',
  title: 'Table cell content',
  of: [
    defineArrayMember({type: 'block', ...tableTextMemberConfig}),
    defineArrayMember({type: 'image'}),
  ],
})

export const standaloneTable = defineType({
  type: 'object',
  name: 'standaloneTable',
  title: 'Standalone table',
  fields: [
    defineField({type: 'number', name: 'headerRows'}),
    defineField({
      type: 'array',
      name: 'rows',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'row',
          fields: [
            defineField({
              type: 'array',
              name: 'cells',
              of: [
                defineArrayMember({
                  type: 'object',
                  name: 'cell',
                  fields: [
                    defineField({
                      type: 'array',
                      name: 'value',
                      of: [
                        defineArrayMember({type: 'block', ...tableTextMemberConfig}),
                        defineArrayMember({type: 'image'}),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  ],
})

// The standalone table field: a Portable Text array constrained to one
// table block. Storage, patches, comments, presence, and serializers all
// see plain Portable Text. The block member never appears in data (the
// one-block behaviors deny root text); it exists because toolbar
// membership and the comments middleware gate (`isArrayOfBlocksSchemaType`)
// both require it, and its config mirrors the cell block config so the
// toolbar offers exactly what cells accept. A factory so every placement
// stays identical.
function standaloneTableField(options: {name: string; title: string; fieldset?: string}) {
  return defineField({
    type: 'array',
    name: options.name,
    title: options.title,
    fieldset: options.fieldset,
    of: [
      defineArrayMember({type: 'block', ...tableTextMemberConfig}),
      defineArrayMember({type: 'image'}),
      defineArrayMember({type: 'standaloneTable'}),
    ],
    components: {
      input: StandaloneTableInput,
      portableText: {
        plugins: StandaloneTablePlugins,
      },
    },
    validation: (rule) => rule.max(1),
  })
}

export const standaloneTableDoc = defineType({
  type: 'document',
  name: 'standaloneTableDoc',
  title: 'Standalone Table',
  fieldsets: [
    {name: 'standalone', title: 'Standalone field'},
    {name: 'inArray', title: 'Inside an object array'},
    {name: 'inPortableText', title: 'Inside Portable Text'},
  ],
  fields: [
    defineField({type: 'string', name: 'title'}),
    // A one-line PT field as a control: real array-of-blocks storage
    // presented as a single-line input (`options.oneLine`), the core
    // precedent proving inline comments survive a narrowed presentation.
    defineField({
      type: 'array',
      name: 'oneLiner',
      title: 'One-line PTE',
      of: [
        defineArrayMember({
          type: 'block',
          options: {oneLine: true},
        }),
      ],
    }),
    standaloneTableField({
      name: 'ptTable',
      title: 'Portable Text table',
      fieldset: 'standalone',
    }),
    defineField({
      type: 'richTable',
      name: 'richTable',
      title: 'Rich table',
      fieldset: 'standalone',
    }),
    // The sections placement: both tables ride as the single field on an
    // object member (ours must wrap in an object since arrays cannot nest
    // arrays directly), exercising array-item form state, dialogs, and
    // nested comment paths.
    defineField({
      type: 'array',
      name: 'ptSections',
      title: 'Portable Text table sections',
      fieldset: 'inArray',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'sectionWithTable',
          title: 'Section with table',
          fields: [standaloneTableField({name: 'table', title: 'Table'})],
        }),
      ],
    }),
    defineField({
      type: 'array',
      name: 'richSections',
      title: 'Rich table sections',
      fieldset: 'inArray',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'sectionWithRichTable',
          title: 'Section with rich table',
          fields: [defineField({type: 'richTable', name: 'table', title: 'Table'})],
        }),
      ],
    }),
    // Both tables embedded in ordinary rich text: one text block config,
    // one table member each. No one-block behaviors and no chrome
    // stripping; the insert menu legitimately offers the table.
    defineField({
      type: 'array',
      name: 'ptBody',
      title: 'Body with Portable Text table',
      fieldset: 'inPortableText',
      of: [defineArrayMember({type: 'block'}), defineArrayMember({type: 'standaloneTable'})],
      components: {
        portableText: {
          plugins: TableContainersPlugins,
        },
      },
    }),
    defineField({
      type: 'array',
      name: 'richBody',
      title: 'Body with rich table',
      fieldset: 'inPortableText',
      of: [
        defineArrayMember({type: 'block'}),
        defineArrayMember({type: 'richTableBlock', name: 'richTableBlock'}),
      ],
    }),
  ],
})
