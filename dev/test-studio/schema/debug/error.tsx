import {Button} from '@sanity/ui'
import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'error',
  type: 'document',
  title: 'Error',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      components: {
        input: () => {
          const errorFunc = () => {
            throw new Error('This is not a real error: we are just testing')
          }
          return <Button onClick={errorFunc} text="Throw error" />
        },
      },
    }),
  ],
})
