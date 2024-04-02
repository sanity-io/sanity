import {HomeIcon} from '@sanity/icons'
import {defineArrayMember, defineField} from 'sanity'
import { GROUPS } from '../../constants'

const TITLE = 'Home'

export const homeType = defineField({
  name: 'home',
  title: TITLE,
  type: 'document',
  icon: HomeIcon,
  groups: GROUPS,
  fields: [
    defineField({
      name: 'hero',
      type: 'hero',
      group: 'editorial',
    }),
    defineField({
      name: 'modules',
      type: 'array',
      of: [
        defineArrayMember({ type: 'accordion' }),
        defineArrayMember({ type: 'callout' }),
        defineArrayMember({ type: 'grid' }),
        defineArrayMember({ type: 'images' }),
        defineArrayMember({ type: 'imageWithProductHotspots', title: 'Image with Hotspots' }),
        defineArrayMember({ type: 'instagram' }),
        defineArrayMember({ type: 'products' }),
      ],
      group: 'editorial',
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
      group: 'seo',
    }),
  ],
  preview: {
    prepare() {
      return {
        media: HomeIcon,
        subtitle: 'Index',
        title: TITLE,
      }
    },
  },
})
