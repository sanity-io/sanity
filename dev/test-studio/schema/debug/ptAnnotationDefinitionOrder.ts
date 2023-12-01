import {defineType, defineField} from 'sanity'

const document = defineType({
  name: 'ptAnnotationDefinitionOrder',
  title: 'Portable Text Annotation Definition Order',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
    }),
    defineField({
      name: 'content',
      title: 'Content',
      type: 'array',
      of: [
        {
          type: 'block',
          marks: {
            annotations: [
              {
                type: 'ptAnnotationDefinitionOrderAnnotation',
              },
            ],
          },
        },
      ],
    }),
  ],
})

const annotation = defineType({
  name: 'ptAnnotationDefinitionOrderAnnotation',
  title: 'Portable Text Annotation Definition Order Annotation',
  type: 'object' as const,
  fields: [
    defineField({
      name: 'url',
      title: 'URL',
      type: 'string',
    }),
  ],
})

export default [document, annotation]
