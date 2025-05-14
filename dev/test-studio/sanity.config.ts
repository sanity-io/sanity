import {colorInput} from '@sanity/color-input'
import {googleMapsInput} from '@sanity/google-maps-input'
import {BookIcon} from '@sanity/icons'
import {SanityMonogram} from '@sanity/logos'
import {visionTool} from '@sanity/vision'
import {defineConfig, type Rule} from 'sanity'
import {structureTool} from 'sanity/structure'
import {markdownSchema} from 'sanity-plugin-markdown'

// Define schema types
const author = {
  name: 'author',
  title: 'Author',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Name',
      type: 'string',
    },
    {
      name: 'bio',
      title: 'Biography',
      type: 'text',
    },
    {
      name: 'location',
      title: 'Location',
      type: 'geopoint',
    },
  ],
}

const post = {
  name: 'post',
  title: 'Post',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule: Rule) => rule.required(),
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
      },
    },
    {
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: [{type: 'author'}],
    },
    {
      name: 'content',
      title: 'Content',
      type: 'markdown',
    },
    {
      name: 'color',
      title: 'Color',
      type: 'color',
    },
  ],
}

// Single workspace configuration
export default defineConfig({
  name: 'default',
  title: 'Test Studio',
  projectId: 'ppsg7ml5',
  dataset: 'test',
  plugins: [
    structureTool({
      icon: BookIcon,
    }),
    visionTool(),
    colorInput(),
    googleMapsInput({
      apiKey: 'AIzaSyDDO2FFi5wXaQdk88S1pQUa70bRtWuMhkI',
      defaultZoom: 11,
      defaultLocation: {
        lat: 40.7058254,
        lng: -74.1180863,
      },
    }),
    markdownSchema(),
  ],
  schema: {
    types: [author, post],
  },
  basePath: '/test',
  icon: SanityMonogram,
  scheduledPublishing: {
    enabled: true,
    inputDateTimeFormat: 'MM/dd/yy h:mm a',
  },
})
