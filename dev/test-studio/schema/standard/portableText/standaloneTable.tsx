import {defineContainer} from '@portabletext/editor'
import {defineBehavior} from '@portabletext/editor/behaviors'
import {BehaviorPlugin} from '@portabletext/editor/plugins'
import {getFocusBlock} from '@portabletext/editor/selectors'
import {defineArrayMember, defineField, defineType, type PortableTextPluginsProps} from 'sanity'

import {StandaloneTableInput} from './StandaloneTableInput'

/**
 * POC: a table as a standalone object field, edited through a Portable
 * Text editor in disguise (see `StandaloneTableInput`). Three types:
 *
 * - `standaloneTable`: the object type fields declare, canonical table
 *   shape under a non-colliding name.
 * - `standaloneTableArray`: hidden. Never used by a document; exists so
 *   the input can borrow a compiled PT array schema carrying the plugin
 *   binding and the cell-shaped root block config.
 * - `standaloneTableDoc`: the demo document.
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
// toolbar offers exactly what cells accept. A factory so the root field
// and the nested-in-sections field stay identical.
function standaloneTableField() {
  return defineField({
    type: 'array',
    name: 'table',
    title: 'Table',
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
  fields: [
    defineField({type: 'string', name: 'title'}),
    // A one-line PT field for side-by-side comparison: real array-of-blocks
    // storage presented as a single-line input (`options.oneLine`), the core
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
    standaloneTableField(),
    // The standalone table field nested inside a normal object array (the
    // sections/page-builder placement): exercises the disguise inside
    // array-item form state, dialogs, and nested comment paths.
    defineField({
      type: 'array',
      name: 'sections',
      title: 'Sections (table inside an object array)',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'sectionWithTable',
          title: 'Section with table',
          fields: [defineField({type: 'string', name: 'heading'}), standaloneTableField()],
          preview: {
            select: {title: 'heading'},
          },
        }),
      ],
    }),
    // The same table type embedded in ordinary rich text: one type, two
    // placements, one serializer registration on the consumer side. No
    // one-block behaviors and no chrome stripping here; the insert menu
    // legitimately offers the table.
    defineField({
      type: 'array',
      name: 'body',
      title: 'Body (table embedded in rich text)',
      of: [defineArrayMember({type: 'block'}), defineArrayMember({type: 'standaloneTable'})],
      components: {
        portableText: {
          plugins: TableContainersPlugins,
        },
      },
    }),
  ],
})
