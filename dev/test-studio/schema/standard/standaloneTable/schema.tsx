import {defineArrayMember, defineField, defineType} from 'sanity'

import {StandaloneTableInputR1} from './spike-r1/StandaloneTableInputR1'
import {StandaloneTableInput} from './StandaloneTableInput'

/**
 * Standalone table field POC — schema.
 *
 * `standaloneTableObject` stores an ordinary nested array structure
 * (rows / row / cells / cell / value[]). There is nothing Portable-Text about
 * the stored shape: `value[]` is just an array of blocks/images. The
 * *editing experience* is disguised — `components.input` swaps in
 * {@link StandaloneTableInput}, which packages the object as a one-block
 * Portable Text value and edits it through a real PT editor with table
 * containers, re-rooting the resulting patches back onto this object's paths.
 *
 * Cells deliberately use a narrower block config than a root block would
 * (styles: normal/quote; decorators: strong/underline; lists: bullet; no
 * annotations) — the same narrowing the `customPlugins` container table uses,
 * so the toolbar's positional disabled state is observable inside a cell.
 */

const cellValueMember = defineArrayMember({
  type: 'block',
  name: 'block',
  styles: [
    {title: 'Normal', value: 'normal'},
    {title: 'Quote', value: 'blockquote'},
  ],
  marks: {
    decorators: [
      {title: 'Strong', value: 'strong'},
      {title: 'Underline', value: 'underline'},
    ],
    annotations: [],
  },
  lists: [{title: 'Bullet', value: 'bullet'}],
  of: [
    defineArrayMember({
      type: 'object',
      name: 'inlineNote',
      title: 'Inline note',
      fields: [defineField({type: 'string', name: 'text', title: 'Text'})],
      preview: {select: {title: 'text'}},
    }),
  ],
})

const cellImageMember = defineArrayMember({
  type: 'image',
  options: {hotspot: true},
  fields: [defineField({name: 'alt', type: 'string', title: 'Alternative text'})],
})

// The rows/cells/value field tree, shared verbatim by both the POC object type
// and the route-1 spike object type so the two inputs edit the identical shape.
const tableRowsField = () =>
  defineField({
    type: 'array',
    name: 'rows',
    title: 'Rows',
    of: [
      defineArrayMember({
        type: 'object',
        name: 'row',
        fields: [
          defineField({
            type: 'array',
            name: 'cells',
            title: 'Cells',
            of: [
              defineArrayMember({
                type: 'object',
                name: 'cell',
                fields: [
                  defineField({
                    type: 'array',
                    name: 'value',
                    title: 'Value',
                    // Narrow block + image, mirroring the cell config used
                    // by the `customPlugins` container table.
                    of: [cellValueMember, cellImageMember],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  })

export const standaloneTableObject = defineType({
  type: 'object',
  name: 'standaloneTableObject',
  title: 'Standalone table',
  fields: [tableRowsField()],
  components: {
    input: StandaloneTableInput,
  },
})

/**
 * Route-1 spike variant: the identical field shape, but edited through Studio's
 * real `PortableTextInput` (via the synthetic-array bridge) instead of the bare
 * `EditorProvider`. Kept as a separate type so both inputs are mountable side
 * by side on the same document. See spike-r1/SPIKE-NOTES.md.
 *
 * NOTE: the `headerRows` number field is what the built-in table plugin's
 * header-row toggle persists into; without it the toggle is a no-op. It is
 * declared here (and absent from the POC type) because only the real input
 * mounts the plugin's table menu.
 */
export const standaloneTableObjectR1 = defineType({
  type: 'object',
  name: 'standaloneTableObjectR1',
  title: 'Standalone table (route 1)',
  fields: [
    tableRowsField(),
    defineField({type: 'number', name: 'headerRows', title: 'Header rows'}),
  ],
  components: {
    input: StandaloneTableInputR1,
  },
})

export const standaloneTable = defineType({
  type: 'document',
  name: 'standaloneTable',
  title: 'Standalone Table',
  fields: [
    defineField({type: 'string', name: 'title', title: 'Title'}),
    defineField({
      type: 'standaloneTableObject',
      name: 'table',
      title: 'Table (POC — bare editor)',
      description:
        'A nested table object (rows > row > cells > cell > value[]) edited through a disguised Portable Text editor. The stored value is plain nested arrays; the editor and its patches are re-rooted onto real field paths. See POC-NOTES.md.',
    }),
    defineField({
      type: 'standaloneTableObjectR1',
      name: 'tableR1',
      title: 'Table (route 1 — real PortableTextInput)',
      description:
        'The same table shape, edited through Studio’s real PortableTextInput via the synthetic-array bridge. Mount side by side with the POC field to compare the chrome delta. See spike-r1/SPIKE-NOTES.md.',
    }),
  ],
  preview: {
    select: {title: 'title'},
    prepare: ({title}) => ({title: title || 'Untitled standalone table'}),
  },
})
