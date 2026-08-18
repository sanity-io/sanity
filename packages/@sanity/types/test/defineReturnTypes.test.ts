import {describe, it} from 'vitest'

import {defineArrayMember, defineField, defineType} from '../src/schema/types'

/**
 * Some of these tests have no expect statement;
 * use of ts-expect-error serves the same purpose - TypeScript is the testrunner here
 */

describe('define helper return types', () => {
  it('should preserve supplied optional properties on defineType return values', () => {
    const documentWithOptionalProps = defineType({
      type: 'document',
      name: 'return-type-document',
      title: 'Return type document',
      description: 'A document used to verify helper return types',
      hidden: true,
      readOnly: false,
      liveEdit: true,
      initialValue: {title: 'Initial title'},
      deprecated: {reason: 'Only used in tests'},
      options: {},
      preview: {
        select: {
          title: 'title',
        },
        prepare: ({title}) => ({title}),
      },
      fields: [{type: 'string', name: 'title'}],
    })

    const titleIsRequired: {title: unknown} = documentWithOptionalProps
    const descriptionIsRequired: {description: unknown} = documentWithOptionalProps
    const hiddenIsRequired: {hidden: unknown} = documentWithOptionalProps
    const readOnlyIsRequired: {readOnly: unknown} = documentWithOptionalProps
    const liveEditIsRequired: {liveEdit: unknown} = documentWithOptionalProps
    const initialValueIsRequired: {initialValue: unknown} = documentWithOptionalProps
    const deprecatedIsRequired: {deprecated: unknown} = documentWithOptionalProps
    const optionsIsRequired: {options: unknown} = documentWithOptionalProps
    const previewIsRequired: {preview: unknown} = documentWithOptionalProps

    const stringWithOptions = defineType({
      type: 'string',
      name: 'return-type-string',
      options: {
        list: ['one', 'two'],
      },
    })

    const nestedOptionsAreRequired: {options: {list: unknown}} = stringWithOptions

    const documentWithoutPreview = defineType({
      type: 'document',
      name: 'return-type-document-without-preview',
      fields: [{type: 'string', name: 'title'}],
    })

    //@ts-expect-error preview is not known to be required when it was not defined
    const omittedPreviewIsNotRequired: {preview: unknown} = documentWithoutPreview

    const looseString = defineType(
      {
        type: 'string',
        name: 'return-type-loose-string',
        doc18n: true,
        options: {
          custom: true,
        },
      },
      {strict: false},
    )

    const unknownStrictFalsePropIsRequired: {doc18n: unknown} = looseString
    const unknownStrictFalseOptionIsRequired: {options: {custom: unknown}} = looseString

    void titleIsRequired
    void descriptionIsRequired
    void hiddenIsRequired
    void readOnlyIsRequired
    void liveEditIsRequired
    void initialValueIsRequired
    void deprecatedIsRequired
    void optionsIsRequired
    void previewIsRequired
    void nestedOptionsAreRequired
    void omittedPreviewIsNotRequired
    void unknownStrictFalsePropIsRequired
    void unknownStrictFalseOptionIsRequired
  })

  it('should preserve supplied optional properties on defineField return values', () => {
    const fieldWithOptionalProps = defineField({
      type: 'string',
      name: 'return-type-field',
      title: 'Return type field',
      description: 'A field used to verify helper return types',
      hidden: true,
      readOnly: false,
      validation: (Rule) => Rule.required(),
      initialValue: 'Initial value',
      options: {
        layout: 'radio',
      },
    })

    const titleIsRequired: {title: unknown} = fieldWithOptionalProps
    const validationIsRequired: {validation: unknown} = fieldWithOptionalProps
    const initialValueIsRequired: {initialValue: unknown} = fieldWithOptionalProps
    const nestedOptionsAreRequired: {options: {layout: unknown}} = fieldWithOptionalProps

    const fieldWithoutOptions = defineField({
      type: 'string',
      name: 'return-type-field-without-options',
    })

    //@ts-expect-error options is not known to be required when it was not defined
    const omittedOptionsAreNotRequired: {options: unknown} = fieldWithoutOptions

    void titleIsRequired
    void validationIsRequired
    void initialValueIsRequired
    void nestedOptionsAreRequired
    void omittedOptionsAreNotRequired
  })

  it('should preserve supplied optional properties on defineArrayMember return values', () => {
    const arrayMemberWithOptionalProps = defineArrayMember({
      type: 'string',
      name: 'return-type-array-member',
      title: 'Return type array member',
      description: 'An array member used to verify helper return types',
      readOnly: false,
      validation: (Rule) => Rule.required(),
      initialValue: 'Initial value',
      options: {
        layout: 'radio',
      },
    })

    const nameIsRequired: {name: unknown} = arrayMemberWithOptionalProps
    const titleIsRequired: {title: unknown} = arrayMemberWithOptionalProps
    const validationIsRequired: {validation: unknown} = arrayMemberWithOptionalProps
    const initialValueIsRequired: {initialValue: unknown} = arrayMemberWithOptionalProps
    const nestedOptionsAreRequired: {options: {layout: unknown}} = arrayMemberWithOptionalProps

    const arrayMemberWithoutName = defineArrayMember({
      type: 'string',
    })

    //@ts-expect-error name is not known to be required when it was not defined
    const omittedNameIsNotRequired: {name: unknown} = arrayMemberWithoutName

    void nameIsRequired
    void titleIsRequired
    void validationIsRequired
    void initialValueIsRequired
    void nestedOptionsAreRequired
    void omittedNameIsNotRequired
  })
})
