import {ImageIcon} from '@sanity/icons'
import pluralize from 'pluralize-esm'
import {defineField} from 'sanity'

export default defineField({
  icon: ImageIcon,
  name: 'imageWithProductHotspots',
  title: 'Image',
  type: 'object',
  fields: [
    defineField({
      name: 'image',
      title: 'Image',
      options: {hotspot: true},
      type: 'image',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'showHotspots',
      title: 'Show product hotspots',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'productHotspots',
      title: 'Product hotspots',
      type: 'productHotspots',
      hidden: ({parent}) => !parent.showHotspots,
    }),
  ],
  preview: {
    select: {
      fileName: 'image.asset.originalFilename',
      hotspots: 'productHotspots',
      image: 'image',
      showHotspots: 'showHotspots',
    },
    prepare(selection) {
      const {fileName, hotspots, image, showHotspots} = selection
      return {
        media: image,
        subtitle:
          showHotspots && hotspots.length > 0
            ? `${pluralize('hotspot', hotspots.length, true)}`
            : undefined,
        title: fileName,
      }
    },
  },
})
