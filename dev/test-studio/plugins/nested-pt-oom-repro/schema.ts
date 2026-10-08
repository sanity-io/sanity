/**
 * Reproduction workspace for the Morrowbank portable text crash reported in
 * https://sanity-io.slack.com/archives/C043ZRB9E4S/p1791449763475549
 *
 * On 6.17, opening a document with this `blockContent` threw
 * `Cannot read properties of undefined (reading 'map')` in
 * `compileInlineObjectOfMember`. EDEX-2600
 * (https://linear.app/sanity/issue/EDEX-2600) fixed that throw. On 6.18.0 /
 * `@portabletext/sanity-bridge` 4.1.2 the throw is gone, and opening a document
 * that has the field sits on "Loading document…" until the tab runs out of memory.
 *
 * The block content, content block, and URL object match the schema they
 * shared. `{type: 'table'}` is theirs too; they did not paste the table type.
 * This table is the nested unnamed-object shape from EDEX-2600 (anonymous rows
 * of anonymous cells), which is what produced the original `map` throw.
 *
 * Manual repro:
 * 1. Open the "Nested PT OOM" workspace (`/nested-pt-oom`).
 * 2. Create a Page. Its initial value already nests a content block, a URL
 *    object, and a table inside Body.
 * 3. The document pane should stay on "Loading document…" and the tab's memory
 *    should climb until it crashes.
 */
import {defineArrayMember, defineField, defineType, type SanityDocument} from 'sanity'

export const NESTED_PT_OOM_PAGE_TYPE = 'nestedPtOomPage'

const INSTRUCTIONS = [
  'Open this document and watch the document pane.',
  'On sanity 6.18 / @portabletext/sanity-bridge 4.1.2 it stays on "Loading document…" and the browser tab runs out of memory.',
  "On 6.17 the same field threw `Cannot read properties of undefined (reading 'map')` in compileInlineObjectOfMember (EDEX-2600).",
  'Body is their blockContent. Content Block is inlined in the text block and its own Blocks fields are that same block content.',
  'Table is anonymous rows of anonymous cells, the nested unnamed-object shape from EDEX-2600.',
].join('\n')

const styleOptions = [
  {title: 'Default', value: 'default'},
  {title: 'Highlight', value: 'highlight'},
]

const blockStyles = [
  {title: 'Body', value: 'normal'},
  {title: 'Body Full Screen', value: 'normalFullScreen'},
  {title: 'Quote large', value: 'quoteLarge'},
  {title: 'Quote medium', value: 'quoteMedium'},
  {title: 'Quote small', value: 'quoteSmall'},
  {title: 'H1', value: 'h1'},
  {title: 'H2', value: 'h2'},
  {title: 'H3', value: 'h3'},
]

const referenceOptions = {
  filter: ({document}: {document: SanityDocument}) => ({
    filter: 'country == $country',
    params: {country: document.country},
  }),
  disableNew: true,
}

function stubObject(name: string, title: string) {
  return defineType({
    name,
    title,
    type: 'object',
    fields: [defineField({name: 'title', type: 'string', title: 'Title'})],
    preview: {select: {title: 'title'}},
  })
}

/**
 * Nested unnamed objects: a row has no type name, and neither does a cell.
 * Compiling this used to throw in `compileInlineObjectOfMember`.
 */
export const nestedPtOomTable = defineType({
  name: 'table',
  title: 'Table',
  type: 'object',
  fields: [
    defineField({
      name: 'rows',
      title: 'Rows',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({
              name: 'cells',
              title: 'Cells',
              type: 'array',
              of: [
                defineArrayMember({
                  type: 'object',
                  fields: [defineField({name: 'text', type: 'string', title: 'Text'})],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  ],
})

const contentBlocks = [
  defineArrayMember({
    name: 'strategicData',
    type: 'reference',
    to: [{type: 'strategicData'}],
    options: referenceOptions,
  }),
  defineArrayMember({
    name: 'urls',
    type: 'object',
    title: 'URL',
    fields: [
      defineField({
        name: 'urlText',
        type: 'string',
        title: 'Text',
        description: 'Text displayed in the link',
        validation: (Rule) => Rule.required(),
      }),
      defineField({
        name: 'url',
        type: 'reference',
        to: [{type: 'urls'}],
        options: {
          filter: ({document}: {document: SanityDocument}) => ({
            filter: 'country == $country',
            params: {country: document.country},
          }),
        },
        validation: (Rule) => Rule.required(),
      }),
    ],
  }),
  defineArrayMember({type: 'fileDownload'}),
  defineArrayMember({type: 'employeeCards'}),
  defineArrayMember({type: 'articleList'}),
  defineArrayMember({
    name: 'articleTeaserBigContentBlock',
    type: 'articleTeaserBigContentBlock',
  }),
  defineArrayMember({type: 'contentBlock'}),
  defineArrayMember({type: 'table'}),
  defineArrayMember({name: 'calculator', type: 'calculator'}),
  defineArrayMember({name: 'calculatorSavings', type: 'calculatorSavings'}),
  defineArrayMember({type: 'warningBox'}),
  defineArrayMember({name: 'video', type: 'video', title: 'Video'}),
  defineArrayMember({name: 'picture', type: 'picture', title: 'Picture'}),
]

const blockContent = defineField({
  name: 'blockContent',
  title: 'Block Content',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: blockStyles,
      of: contentBlocks,
    }),
  ],
})

function columnsOf(parent: unknown): number | undefined {
  if (!parent || typeof parent !== 'object' || !('columns' in parent)) return undefined
  return typeof parent.columns === 'number' ? parent.columns : undefined
}

function blockContentField(
  name: 'blocks' | 'blocksLeft' | 'blocksRight',
  title: string,
  shownForTwoColumns: boolean,
) {
  return defineField({
    ...blockContent,
    name,
    title,
    hidden: ({parent}) => {
      const columns = columnsOf(parent)
      return shownForTwoColumns ? columns !== 2 : columns === 2
    },
    validation: (Rule) =>
      Rule.custom((value, context) => {
        const columns = columnsOf(context.parent)
        const wantsValue = shownForTwoColumns ? columns === 2 : columns !== 2
        if (wantsValue && !value) return 'This field is required'
        return true
      }),
  })
}

export const nestedPtOomContentBlock = defineType({
  name: 'contentBlock',
  title: 'Content Block',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      title: 'Title',
      description: "Only used internally here in Sanity. It's not visible on the website.",
    }),
    defineField({
      name: 'columns',
      title: 'Columns',
      type: 'number',
      initialValue: 1,
      options: {
        list: [
          {title: 'One Column', value: 1},
          {title: 'Two Columns', value: 2},
        ],
      },
    }),
    defineField({
      name: 'style',
      title: 'Style',
      type: 'string',
      options: {list: styleOptions},
      hidden: ({parent}) => parent?.columns === 2,
    }),
    blockContentField('blocks', 'Content', false),
    defineField({
      name: 'styleLeft',
      title: 'Style Left',
      type: 'string',
      options: {list: styleOptions},
      hidden: ({parent}) => parent?.columns !== 2,
    }),
    blockContentField('blocksLeft', 'Content Left', true),
    defineField({
      name: 'styleRight',
      title: 'Style Right',
      type: 'string',
      options: {list: styleOptions},
      hidden: ({parent}) => parent?.columns !== 2,
    }),
    blockContentField('blocksRight', 'Content Right', true),
  ],
})

const urls = defineType({
  name: 'urls',
  title: 'URL',
  type: 'document',
  fields: [
    defineField({name: 'title', type: 'string', title: 'Title'}),
    defineField({name: 'country', type: 'string', title: 'Country'}),
  ],
})

const strategicData = defineType({
  name: 'strategicData',
  title: 'Strategic data',
  type: 'document',
  fields: [
    defineField({name: 'title', type: 'string', title: 'Title'}),
    defineField({name: 'country', type: 'string', title: 'Country'}),
  ],
})

const nestedPtOomPage = defineType({
  name: NESTED_PT_OOM_PAGE_TYPE,
  title: 'Page',
  type: 'document',
  fields: [
    defineField({
      name: 'instructions',
      type: 'text',
      title: 'How to reproduce',
      rows: 6,
      readOnly: true,
      initialValue: INSTRUCTIONS,
    }),
    defineField({name: 'title', type: 'string', title: 'Title'}),
    defineField({name: 'country', type: 'string', title: 'Country', initialValue: 'NO'}),
    defineField({
      ...blockContent,
      name: 'body',
      title: 'Body',
    }),
  ],
  initialValue: {
    title: 'Nested portable text',
    country: 'NO',
    instructions: INSTRUCTIONS,
    body: [
      {
        _type: 'block',
        _key: 'intro',
        style: 'normal',
        markDefs: [],
        children: [
          {_type: 'span', _key: 'introSpan', text: 'Intro ', marks: []},
          {
            _type: 'contentBlock',
            _key: 'nestedBlock',
            columns: 1,
            title: 'Nested content block',
            blocks: [
              {
                _type: 'block',
                _key: 'inner',
                style: 'normal',
                markDefs: [],
                children: [
                  {_type: 'span', _key: 'innerSpan', text: 'Inner ', marks: []},
                  {_type: 'urls', _key: 'innerUrl', urlText: 'Example'},
                  {
                    _type: 'table',
                    _key: 'innerTable',
                    rows: [
                      {
                        _key: 'row',
                        cells: [{_key: 'cell', text: 'Cell'}],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  preview: {
    select: {title: 'title', subtitle: 'country'},
  },
})

export const nestedPtOomSchemaTypes = [
  nestedPtOomPage,
  nestedPtOomContentBlock,
  nestedPtOomTable,
  urls,
  strategicData,
  stubObject('fileDownload', 'File download'),
  stubObject('employeeCards', 'Employee cards'),
  stubObject('articleList', 'Article list'),
  stubObject('articleTeaserBigContentBlock', 'Article teaser'),
  stubObject('calculator', 'Calculator'),
  stubObject('calculatorSavings', 'Calculator savings'),
  stubObject('warningBox', 'Warning box'),
  stubObject('video', 'Video'),
  stubObject('picture', 'Picture'),
]
