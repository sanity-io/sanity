import {MdTv as icon} from 'react-icons/md'

export default {
  name: 'previewMediaTest',
  type: 'document',
  title: 'Preview: Using media in preview',
  icon,
  preview: {
    select: {
      title: 'title',
      media: 'image',
    },
  },
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {hotspot: true}, // tweaking the hotspot should be reflected in the preview
    },
    {
      name: 'array',
      type: 'array',
      title: 'Array',
      of: [{type: 'reference', to: {type: 'previewMediaTest'}}],
    },
  ],
}
