/**
 * Reproduction schema for https://github.com/sanity-io/sanity/issues/4741
 *
 * `options.modal` on **array fields** controls the edit UI for array items
 * (`PreviewItem` / `GridItem` → `EnhancedObjectDialog` / `EditPortal`).
 *
 * `options.modal` on **object types** (e.g. PTE annotations) is read via
 * `_getModalOption` → `ObjectEditModal`.
 *
 * Width is a theme container index (1–5 → 640–1920px) or `'auto'`, not pixels.
 *
 * Manual repro:
 * 1. Structure → Inputs → Debug → Modal options repro (#4741).
 * 2. Use the document tabs: Array dialog, Array popover, Object dialog, Object popover.
 * 3. Arrays: click **Add item** per field; inspect `nested-object-dialog` or
 *    `[data-ui="PopoverContainer"]`.
 * 4. Objects: add text in the PTE field, apply each annotation mark, open the editor;
 *    inspect `popover-edit-dialog` / `default-edit-object-dialog` / `nested-object-dialog`.
 * 5. Edge cases tab: out-of-range width, responsive width, modal on array member vs array.
 */
import {defineArrayMember, defineField, defineType, type ModalOptions} from 'sanity'

const MODAL_WIDTH_GROUPS = [
  {name: 'arrayDialog', title: 'Array · dialog', default: true},
  {name: 'arrayPopover', title: 'Array · popover'},
  {name: 'objectDialog', title: 'Object · dialog'},
  {name: 'objectPopover', title: 'Object · popover'},
  {name: 'edgeCases', title: 'Edge cases'},
] as const

type ModalWidthGroup = (typeof MODAL_WIDTH_GROUPS)[number]['name']

const arrayItemFields = [
  defineField({
    name: 'title',
    type: 'string',
    title: 'Title',
  }),
]

const arrayItem = defineArrayMember({
  type: 'object',
  name: 'item',
  fields: arrayItemFields,
})

type ModalWidthVariant = 'default' | '2' | '5' | 'auto'

const MODAL_WIDTH_VARIANTS: {
  key: ModalWidthVariant
  title: string
  width?: ModalOptions['width']
}[] = [
  {key: 'default', title: 'default (width omitted)', width: undefined},
  {key: '2', title: 'width: 2 (~960px)', width: 2},
  {key: '5', title: 'width: 5 (~1920px)', width: 5},
  {key: 'auto', title: 'width: "auto"', width: 'auto'},
]

function buildArrayModalFields(
  modalType: 'dialog' | 'popover',
  group: ModalWidthGroup,
): ReturnType<typeof defineField>[] {
  return MODAL_WIDTH_VARIANTS.map(({key, title, width}) => {
    const modal: ModalOptions = {type: modalType}
    if (width !== undefined) {
      modal.width = width
    }

    return defineField({
      name: `${group}_${key}`,
      title: `Array · ${modalType} · ${title}`,
      description: `options.modal on the array field. type: "${modalType}"${
        width === undefined
          ? ', width omitted (studio falls back to 1)'
          : `, width: ${JSON.stringify(width)}`
      }.`,
      type: 'array',
      group,
      options: {modal},
      of: [arrayItem],
    })
  })
}

function createModalAnnotation(
  name: string,
  title: string,
  modal: ModalOptions,
): {
  name: string
  type: 'object'
  title: string
  fields: ReturnType<typeof defineField>[]
  options: {modal: ModalOptions}
} {
  return {
    name,
    type: 'object',
    title,
    fields: [
      defineField({
        name: 'note',
        type: 'string',
        title: 'Note',
      }),
    ],
    options: {modal},
  }
}

function buildObjectModalPteField(
  modalType: 'dialog' | 'popover',
  group: ModalWidthGroup,
): ReturnType<typeof defineField> {
  const annotations = MODAL_WIDTH_VARIANTS.map(({key, title, width}) => {
    const modal: ModalOptions = {type: modalType}
    if (width !== undefined) {
      modal.width = width
    }

    return createModalAnnotation(
      `${group}_annotation_${key}`,
      `Object · ${modalType} · ${title}`,
      modal,
    )
  })

  return defineField({
    name: `${group}_pte`,
    title: `Object · ${modalType} · all widths`,
    description: `Portable Text with ${annotations.length} annotation types (one per width variant). Select text, open the annotation toolbar, and add each mark to compare modal behavior. options.modal is on the object type, not the array.`,
    type: 'array',
    group,
    of: [
      {
        type: 'block',
        marks: {
          annotations,
        },
      },
    ],
  })
}

export const arrayModalWidthRepro = defineType({
  name: 'arrayModalWidthReproTest',
  type: 'document',
  description:
    'Tabbed repro for options.modal.type and options.modal.width on arrays and objects (PTE annotations).',
  groups: [...MODAL_WIDTH_GROUPS],
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      group: 'arrayDialog',
      initialValue: 'Issue #4741 — modal options repro',
    }),
    defineField({
      name: 'notes',
      type: 'text',
      title: 'How to use',
      group: 'arrayDialog',
      readOnly: true,
      initialValue: [
        'Array tabs: Add item on each field; width comes from the array field options.modal.',
        'Object tabs: Type in the PTE field, select text, add an annotation from the toolbar.',
        'Edge cases: invalid width, responsive width array (objects only), modal on array member vs array field.',
        'Not covered here: deprecated options.editModal, layout grid/tags, insertMenu.',
      ].join('\n'),
    }),
    ...buildArrayModalFields('dialog', 'arrayDialog'),
    ...buildArrayModalFields('popover', 'arrayPopover'),
    buildObjectModalPteField('dialog', 'objectDialog'),
    buildObjectModalPteField('popover', 'objectPopover'),
    defineField({
      name: 'edgeCases_arrayDialogWidth7',
      title: 'Array · dialog · width: 7 (original issue)',
      description:
        'Out-of-range index from the GitHub report. Historically produced max-width: NaNrem on DialogCard.',
      type: 'array',
      group: 'edgeCases',
      options: {
        modal: {
          type: 'dialog',
          // @ts-expect-error 7 is not in ModalOptions (valid: 1–5 | auto)
          width: 7,
        },
      },
      of: [arrayItem],
    }),
    defineField({
      name: 'edgeCases_arrayPopoverWidth7',
      title: 'Array · popover · width: 7',
      description: 'Same invalid index with popover; inspect PopoverContainer width.',
      type: 'array',
      group: 'edgeCases',
      options: {
        modal: {
          type: 'popover',
          // @ts-expect-error 7 is not in ModalOptions (valid: 1–5 | auto)
          width: 7,
        },
      },
      of: [arrayItem],
    }),
    defineField({
      name: 'edgeCases_arrayModalOnMember',
      title: 'Array — modal on item type (ignored when editing)',
      description:
        'The array field uses dialog width 2. Modal on the object member (popover width 5) is not applied when opening array items — only parentSchemaType (the array) is read.',
      type: 'array',
      group: 'edgeCases',
      options: {
        modal: {type: 'dialog', width: 2},
      },
      of: [
        defineArrayMember({
          type: 'object',
          name: 'itemWithOwnModal',
          title: 'Item (modal on type ignored)',
          options: {
            modal: {type: 'popover', width: 5},
          },
          fields: arrayItemFields,
        }),
      ],
    }),
    defineField({
      name: 'edgeCases_objectResponsiveWidth',
      title: 'Object · dialog · responsive width [2, 5]',
      description:
        'Objects support width as a number array for responsive breakpoints (parsed by _getModalOption). Arrays only accept a single number | auto.',
      type: 'array',
      group: 'edgeCases',
      of: [
        {
          type: 'block',
          marks: {
            annotations: [
              createModalAnnotation('responsiveWidth', 'Responsive width [2, 5]', {
                type: 'dialog',
                // @ts-expect-error arrays of widths are valid at runtime for objects
                width: [2, 5],
              }),
            ],
          },
        },
      ],
    }),
    defineField({
      name: 'edgeCases_arrayModalTypeOmitted',
      title: 'Array — modal.type omitted (defaults to dialog)',
      description: 'Only width: 2 is set; modal.type falls back to "dialog" in PreviewItem.',
      type: 'array',
      group: 'edgeCases',
      options: {
        modal: {
          width: 2,
        },
      },
      of: [arrayItem],
    }),
  ],
  preview: {
    select: {title: 'title'},
    prepare({title}) {
      return {
        title: title || 'Modal options repro (#4741)',
        subtitle: 'Array + object modal.width tabs',
      }
    },
  },
})
