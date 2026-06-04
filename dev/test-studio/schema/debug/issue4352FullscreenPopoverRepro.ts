/**
 * Reproduction schema for https://github.com/sanity-io/sanity/issues/4352
 *
 * Issue: Popovers inside Portable Text Editor fullscreen mode sometimes receive
 * a `hidden` attribute and fail to open (notably image "Select" menus and other
 * MenuButton popovers in deeply nested edit dialogs).
 *
 * Manual repro:
 * 1. Structure → Inputs → Debug → Fullscreen popover repro (#4352).
 * 2. Open the Body field and enter fullscreen (expand icon).
 * 3. Add an Accordion block, then add a Section inside it.
 * 4. Open the section editor (nested dialog) and add content in the nested Body PTE.
 * 5. Insert an Image block, then click "Select" on the image field.
 * 6. Expected: asset source popover opens. Actual (bug): popover may get `hidden`
 *    and stay invisible — inspect `[data-ui="MenuButton__popover"][hidden]`.
 *
 * Compare with the same steps outside fullscreen, or with the baseline Body field
 * on the Baseline tab (no accordion nesting).
 */
import {defineArrayMember, defineField, defineType} from 'sanity'

const testOptionList = Array.from({length: 50}, (_, index) => ({
  title: index.toString(),
  value: index.toString(),
}))

const issue4352NestedImageFields = [
  defineField({
    name: 'testOption',
    type: 'string',
    title: 'Test option',
    description: 'Radio list inside nested image dialog — another popover surface.',
    options: {
      list: testOptionList,
      layout: 'radio',
    },
  }),
]

const issue4352NestedSectionBodyMembers = [
  defineArrayMember({type: 'block'}),
  defineArrayMember({
    type: 'image',
    name: 'image',
    title: 'Image',
    fields: issue4352NestedImageFields,
  }),
]

const issue4352AccordionBlock = defineArrayMember({
  name: 'accordion',
  title: 'Accordion',
  type: 'object',
  fields: [
    defineField({
      name: 'sections',
      title: 'Sections',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'section',
          title: 'Section',
          fields: [
            defineField({
              name: 'title',
              title: 'Title',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({
              type: 'array',
              name: 'body',
              title: 'Body',
              description:
                'Nested PTE — add an image here, then use Select while parent editor is fullscreen.',
              of: issue4352NestedSectionBodyMembers,
            }),
          ],
        }),
      ],
    }),
  ],
})

const issue4352BodyFieldMembers = [
  defineArrayMember({type: 'block'}),
  issue4352AccordionBlock,
  defineArrayMember({
    type: 'image',
    name: 'image',
    title: 'Image',
    fields: issue4352NestedImageFields,
  }),
]

export const issue4352FullscreenPopoverRepro = defineType({
  name: 'issue4352FullscreenPopoverRepro',
  type: 'document',
  title: 'Fullscreen popover repro (#4352)',
  description:
    'Reproduction for issue #4352: MenuButton popovers break inside PTE fullscreen with nested dialogs.',
  groups: [
    {name: 'repro', title: 'Repro', default: true},
    {name: 'baseline', title: 'Baseline'},
  ],
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      group: 'repro',
      initialValue: 'Issue #4352 — fullscreen popover repro',
    }),
    defineField({
      name: 'notes',
      type: 'text',
      title: 'How to reproduce',
      group: 'repro',
      readOnly: true,
      rows: 10,
      initialValue: [
        '1. Use the Body field below (Repro tab).',
        '2. Enter PTE fullscreen mode.',
        '3. Add Accordion → Section → nested Body with an Image block.',
        '4. Open the section dialog, click Select on the image field.',
        '5. Bug: [data-ui="MenuButton__popover"] may have the hidden attribute.',
        '',
        'Baseline tab: same image field without accordion nesting (should work).',
        'Also reported with split-pane editing the same document.',
      ].join('\n'),
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      group: 'repro',
      of: issue4352BodyFieldMembers,
    }),
    defineField({
      name: 'baselineBody',
      title: 'Body (no nesting)',
      description:
        'Flat PTE with image block only — use to confirm Select popover works outside nested fullscreen dialogs.',
      type: 'array',
      group: 'baseline',
      of: [
        defineArrayMember({type: 'block'}),
        defineArrayMember({
          type: 'image',
          name: 'image',
          title: 'Image',
          fields: issue4352NestedImageFields,
        }),
      ],
    }),
  ],
  preview: {
    select: {title: 'title'},
    prepare({title}) {
      return {
        title: title || 'Fullscreen popover repro (#4352)',
        subtitle: 'PTE fullscreen + nested accordion + image Select',
      }
    },
  },
})
