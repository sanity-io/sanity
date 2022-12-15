/* eslint-disable @typescript-eslint/no-unused-vars */
// noinspection JSUnusedLocalSymbols

import {
  CrossDatasetReferenceValue,
  defineArrayMember,
  defineField,
  defineType,
  FileValue,
  GeopointValue,
  ImageValue,
  ReferenceValue,
  SlugValue,
} from '@sanity/types'
import {defineConfig} from '../../config'
import {PreviewProps} from '../../components'
import {CrossDatasetReferenceInputProps, ReferenceInputProps} from '../studio'
import {
  ArrayOfObjectsInputProps,
  ArrayOfPrimitivesInputProps,
  BooleanInputProps,
  InputProps,
  NumberInputProps,
  ObjectInputProps,
  StringInputProps,
} from './inputProps'
import {
  ArrayFieldProps,
  ArrayOfPrimitivesFieldProps,
  BooleanFieldProps,
  FieldProps,
  NumberFieldProps,
  ObjectFieldProps,
  StringFieldProps,
} from './fieldProps'
import {ObjectItem, ObjectItemProps, PrimitiveItemProps} from './itemProps'
import {
  ArrayOfObjectsComponents,
  ArrayOfPrimitivesComponents,
  BooleanComponents,
  CrossDatasetReferenceComponents,
  DateComponents,
  DatetimeComponents,
  DocumentComponents,
  EmailComponents,
  FileComponents,
  GeopointComponents,
  ImageComponents,
  NumberComponents,
  ObjectComponents,
  ReferenceComponents,
  SlugComponents,
  SpanComponents,
  StringComponents,
  TextComponents,
  UrlComponents,
} from './definitionExtensions'

describe('definitionExtensions', () => {
  describe('array-like types', () => {
    it('should extend components for array of objects', () => {
      const type = defineType({
        type: 'array',
        name: 'test',
        of: [{type: 'some-object'}],
        // we dont narrow array type yet
        // therefor we have to explicitly put the prop types do differentiate between object/primitive
        components: {
          diff: (props) => null,
          field: (props: ArrayFieldProps) => {
            return null
          },
          input: (props: ArrayOfObjectsInputProps) => {
            return null
          },
          item: (props: ObjectItemProps) => {
            return null
          },
          preview: (props) => null,
        },
      })

      // this typing is not ideal, but leaving it as this until we decide to narrow array type
      const components: ArrayOfObjectsComponents | ArrayOfPrimitivesComponents | undefined =
        type.components
    })

    it('should extend components for array of primitives', () => {
      defineType({
        type: 'array',
        name: 'test',
        of: [{type: 'number'}],
        components: {
          diff: (props) => null,
          field: (props: ArrayOfPrimitivesFieldProps) => {
            return null
          },
          input: (props: ArrayOfPrimitivesInputProps) => {
            return null
          },
          item: (props: PrimitiveItemProps) => {
            return null
          },
          preview: (props) => null,
        },
      })
    })

    it('should not allow mixing primitive and object components', () => {
      defineType({
        type: 'array',
        name: 'test',
        of: [{type: 'number'}],
        components: {
          diff: (props) => null,
          //@ts-expect-error ArrayFieldProps not allowed in ArrayOfPrimitivesComponents
          field: (props: ArrayFieldProps) => {
            return null
          },
          input: (props: ArrayOfPrimitivesInputProps) => {
            return null
          },
          item: (props: PrimitiveItemProps) => {
            return null
          },
          preview: (props) => null,
        },
      })
    })

    it('should not allow non-array props', () => {
      defineType({
        type: 'array',
        name: 'test',
        of: [{type: 'number'}],
        components: {
          diff: (props) => null,
          //@ts-expect-error string not assignable to props
          field: (props: string) => {
            return null
          },
          //@ts-expect-error string not assignable to props
          input: (props: string) => {
            return null
          },
          //@ts-expect-error string not assignable to props
          item: (props: string) => {
            return null
          },
          //@ts-expect-error string not assignable to props
          preview: (props: string) => null,
        },
      })
    })
  })

  it('should extend components for block .of and .components', () => {
    defineArrayMember({
      type: 'block',
      name: 'test',
      of: [{type: 'author', components: {inlineBlock: () => null}}],
      components: {
        block: () => null,
      },
    })
  })

  it('should extend components for boolean', () => {
    const type = defineType({
      type: 'boolean',
      name: 'test',
      components: {
        diff: (props) => null,
        field: (props) => {
          const obj: BooleanFieldProps = props
          return null
        },
        input: (props) => {
          const obj: BooleanInputProps = props
          return null
        },
        item: (props) => {
          const obj: PrimitiveItemProps = props
          return null
        },
        preview: (props) => {
          const obj: PreviewProps = props
          return null
        },
      },
    })

    const components: BooleanComponents | undefined = type.components
  })

  it('should extend components for number', () => {
    const type = defineType({
      type: 'number',
      name: 'test',
      components: {
        diff: (props) => null,
        field: (props) => {
          const obj: NumberFieldProps = props
          return null
        },
        input: (props) => {
          const obj: NumberInputProps = props
          return null
        },
        item: (props) => {
          const obj: PrimitiveItemProps = props
          return null
        },
        preview: (props) => {
          const obj: PreviewProps = props
          return null
        },
      },
    })

    const components: NumberComponents | undefined = type.components
  })

  describe('string-like types', () => {
    // if the component defs for string-like definitions change, reusing this will no longer work
    const stringlikeComponents: StringComponents = {
      diff: (props) => null,
      field: (props) => {
        const obj: StringFieldProps = props
        return null
      },
      input: (props) => {
        const obj: StringInputProps = props
        return null
      },
      item: (props) => {
        const obj: PrimitiveItemProps = props
        return null
      },
      preview: (props) => {
        const obj: PreviewProps = props
        return null
      },
    }

    it('should extend components for date', () => {
      const type = defineType({
        type: 'date',
        name: 'test',
        components: stringlikeComponents,
      })
      const components: DateComponents | undefined = type.components
    })

    it('should extend components for datetime', () => {
      const type = defineType({
        type: 'datetime',
        name: 'test',
        components: stringlikeComponents,
      })
      const components: DatetimeComponents | undefined = type.components
    })

    it('should extend components for datetime', () => {
      const type = defineType({
        type: 'datetime',
        name: 'test',
        components: stringlikeComponents,
      })
      const components: DatetimeComponents | undefined = type.components
    })

    it('should extend components for string', () => {
      const type = defineType({
        type: 'string',
        name: 'test',
        components: stringlikeComponents,
      })
      const components: StringComponents | undefined = type.components
    })

    it('should extend components for text', () => {
      const type = defineType({
        type: 'text',
        name: 'test',
        components: stringlikeComponents,
      })
      const components: TextComponents | undefined = type.components
    })

    it('should extend components for text', () => {
      const type = defineType({
        type: 'text',
        name: 'test',
        components: stringlikeComponents,
      })
      const components: TextComponents | undefined = type.components
    })

    it('should extend components for url', () => {
      const type = defineType({
        type: 'url',
        name: 'test',
        components: stringlikeComponents,
      })
      const components: UrlComponents | undefined = type.components
    })

    it('should extend components for email', () => {
      const type = defineType({
        type: 'email',
        name: 'test',
        components: stringlikeComponents,
      })
      const components: EmailComponents | undefined = type.components
    })
  })

  describe('object-like types', () => {
    it('should extend components for document', () => {
      const type = defineType({
        type: 'document',
        name: 'test',
        fields: [],
        components: {
          diff: (props) => null,
          field: (props) => {
            const obj: ObjectFieldProps = props
            return null
          },
          input: (props) => {
            const obj: ObjectInputProps = props
            return null
          },
          item: (props) => {
            const obj: ObjectItemProps = props
            return null
          },
          preview: (props) => {
            const obj: PreviewProps = props
            return null
          },
        },
      })
      const components: DocumentComponents | undefined = type.components
    })

    it('should extend components for file', () => {
      const type = defineType({
        type: 'file',
        name: 'test',
        components: {
          diff: (props) => null,
          field: (props) => {
            const obj: ObjectFieldProps<FileValue> = props
            return null
          },
          input: (props) => {
            const obj: ObjectInputProps<FileValue> = props
            return null
          },
          item: (props) => {
            const obj: ObjectItemProps<FileValue & ObjectItem> = props
            return null
          },
          preview: (props) => {
            const obj: PreviewProps = props
            return null
          },
        },
      })
      const components: FileComponents | undefined = type.components
    })

    it('should allow value-type narrowing for file', () => {
      const type = defineType({
        type: 'file',
        name: 'test',
        components: {
          diff: (props) => null,
          field: (props: ObjectFieldProps<FileValue & {narrow?: true}>) => {
            return null
          },
          input: (props: ObjectInputProps<FileValue & {narrow?: true}>) => {
            return null
          },
          item: (props: ObjectItemProps<FileValue & ObjectItem & {narrow?: true}>) => {
            return null
          },
        },
      })
      const components: FileComponents | undefined = type.components
    })

    it('should extend components for geopoint', () => {
      const type = defineType({
        type: 'geopoint',
        name: 'test',
        components: {
          diff: (props) => null,
          field: (props) => {
            const obj: ObjectFieldProps<GeopointValue> = props
            return null
          },
          input: (props) => {
            const obj: ObjectInputProps<GeopointValue> = props
            return null
          },
          item: (props) => {
            const obj: ObjectItemProps<GeopointValue & ObjectItem> = props
            return null
          },
          preview: (props) => {
            const obj: PreviewProps = props
            return null
          },
        },
      })
      const components: GeopointComponents | undefined = type.components
    })

    it('should extend components for image', () => {
      const type = defineType({
        type: 'image',
        name: 'test',
        components: {
          diff: (props) => null,
          field: (props) => {
            const obj: ObjectFieldProps<ImageValue> = props
            return null
          },
          input: (props) => {
            const obj: ObjectInputProps<ImageValue> = props
            return null
          },
          item: (props) => {
            const obj: ObjectItemProps<ImageValue & ObjectItem> = props
            return null
          },
          preview: (props) => {
            const obj: PreviewProps = props
            return null
          },
        },
      })
      const components: ImageComponents | undefined = type.components
    })

    it('should extend components for object', () => {
      const type = defineType({
        type: 'object',
        name: 'test',
        fields: [],
        components: {
          diff: (props) => null,
          field: (props) => {
            const obj: ObjectFieldProps = props
            return null
          },
          input: (props) => {
            const obj: ObjectInputProps = props
            return null
          },
          item: (props) => {
            const obj: ObjectItemProps = props
            return null
          },
          preview: (props) => {
            const obj: PreviewProps = props
            return null
          },
        },
      })
      const components: ObjectComponents | undefined = type.components
    })

    it('should allow developer to narrow value-type  props for object', () => {
      const type = defineType({
        type: 'object',
        name: 'test',
        fields: [],
        components: {
          field: (props: ObjectFieldProps<{narrow?: true}>) => {
            return null
          },
          input: (props: ObjectInputProps<{narrow?: true}>) => {
            return null
          },
          item: (props: ObjectItemProps<ObjectItem & {narrow?: true}>) => {
            return null
          },
        },
      })
      const components: ObjectComponents | undefined = type.components
    })

    it('should extend components for reference', () => {
      const type = defineType({
        type: 'reference',
        name: 'test',
        to: [{type: 'some-object'}],
        components: {
          diff: (props) => null,
          field: (props) => {
            const obj: ObjectFieldProps<ReferenceValue> = props
            return null
          },
          input: (props) => {
            const obj: ObjectInputProps<ReferenceValue> = props
            const advancedObj: ReferenceInputProps = props
            return null
          },
          item: (props) => {
            const obj: ObjectItemProps<ReferenceValue & ObjectItem> = props
            return null
          },
          preview: (props) => {
            const obj: PreviewProps = props
            return null
          },
        },
      })
      const components: ReferenceComponents | undefined = type.components
    })

    it('should assign props to InputProps ect', () => {
      const type = defineType({
        type: 'reference',
        name: 'test',
        to: [{type: 'some-object'}],
        components: {
          diff: (props) => null,
          field: (props) => {
            const obj: FieldProps = props
            return null
          },
          input: (props) => {
            const obj: InputProps = props
            return null
          },
          item: (props) => {
            const obj: ObjectItemProps<ReferenceValue & ObjectItem> = props
            return null
          },
          preview: (props) => {
            const obj: PreviewProps = props
            return null
          },
        },
      })
    })

    it('should extend components for crossDatasetReference', () => {
      const type = defineType({
        type: 'crossDatasetReference',
        name: 'test',
        projectId: 'test',
        dataset: 'test',
        to: [{type: 'some-object'}],
        components: {
          diff: (props) => null,
          field: (props) => {
            const obj: ObjectFieldProps<CrossDatasetReferenceValue> = props
            return null
          },
          input: (props) => {
            const obj: ObjectInputProps<CrossDatasetReferenceValue> = props
            const advancedObj: CrossDatasetReferenceInputProps = props
            return null
          },
          item: (props) => {
            const obj: ObjectItemProps<CrossDatasetReferenceValue & ObjectItem> = props
            return null
          },
          preview: (props) => {
            const obj: PreviewProps = props
            return null
          },
        },
      })
      const components: CrossDatasetReferenceComponents | undefined = type.components
    })

    it('should extend components for slug', () => {
      const type = defineType({
        type: 'slug',
        name: 'test',
        components: {
          diff: (props) => null,
          field: (props) => {
            const obj: ObjectFieldProps<SlugValue> = props
            return null
          },
          input: (props) => {
            const obj: ObjectInputProps<SlugValue> = props
            return null
          },
          item: (props) => {
            const obj: ObjectItemProps<SlugValue & ObjectItem> = props
            return null
          },
          preview: (props) => {
            const obj: PreviewProps = props
            return null
          },
        },
      })
      const components: SlugComponents | undefined = type.components
    })
  })

  it('should allow components for fields without defineField', () => {
    defineType({
      type: 'document',
      name: 'test',
      fields: [
        {
          type: 'string',
          name: 'title',
          components: {
            input: (props: StringInputProps) => null,
          },
        },
      ],
    })
  })

  it('should allow components for fields with defineField', () => {
    defineType({
      type: 'document',
      name: 'test',
      fields: [
        defineField({
          type: 'string',
          name: 'title',
          components: {
            input: (props: StringInputProps) => null,
          },
        }),
      ],
    })
  })
})

export {}
