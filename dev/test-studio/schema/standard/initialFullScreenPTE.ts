import {defineField, defineType} from 'sanity'

export const initialFullScreenPTEType = defineType({
  name: 'initialFullScreenPTE',
  title: 'Initial full screen PTE',
  type: 'document',
  fields: [
    defineField({
      name: 'text',
      type: 'array',
      of: [{type: 'block'}],

      components: {
        input: (props: any) => {
          return props.renderDefault({...props, initialFullscreen: true})
        },
      },
    }),
  ],
})
