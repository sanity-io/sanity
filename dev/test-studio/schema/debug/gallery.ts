import {defineArrayMember, defineField, defineType} from 'sanity'

export default defineType({
  name: 'gallery',
  type: 'document',
  title: 'Galleries',
  fields: [
    defineField({
      name: 'images',
      type: 'array',
      title: 'Images',
      of: [
        defineArrayMember({
          name: 'image',
          title: 'Image',
          type: 'image',
          options: {
            metadata: ['blurhash', 'lqip', 'palette', 'exif'],
            hotspot: true,
            storeOriginalFilename: false,
          },
        }),
      ],
      options: {
        layout: 'grid',
      },
    }),
  ],
})
