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
]

function StandaloneTablePlugins(props: PortableTextPluginsProps) {
  return (
    <>
      {props.renderDefault({
        ...props,
        plugins: {
          ...props.plugins,
          table: {enabled: true, containers: standaloneTableContainers},
        },
      })}
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
                        defineArrayMember({
                          type: 'block',
                          lists: [],
                          marks: {
                            decorators: [
                              {title: 'Strong', value: 'strong'},
                              {title: 'Emphasis', value: 'em'},
                            ],
                          },
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
    }),
  ],
})

export const standaloneTableArray = defineType({
  type: 'array',
  name: 'standaloneTableArray',
  title: 'Standalone table array (internal)',
  hidden: true,
  of: [
    // The root block config mirrors the cell block config, so the
    // toolbar's membership (root-derived) matches what cells accept and
    // the applicable-schema gating agrees with it at every position.
    defineArrayMember({
      type: 'block',
      lists: [],
      marks: {
        decorators: [
          {title: 'Strong', value: 'strong'},
          {title: 'Emphasis', value: 'em'},
        ],
        annotations: [],
      },
    }),
    defineArrayMember({type: 'standaloneTable'}),
  ],
  components: {
    portableText: {
      plugins: StandaloneTablePlugins,
    },
  },
})

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
    defineField({
      type: 'standaloneTable',
      name: 'table',
      title: 'Table',
      components: {input: StandaloneTableInput},
    }),
  ],
})
