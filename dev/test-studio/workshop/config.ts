import {a11yPlugin, defineConfig, perfPlugin} from '@sanity/ui-workshop'
import {scopes} from './scopes'

export const config = defineConfig({
  collections: [
    {
      name: 'sanity',
      title: 'sanity',
    },
    {
      name: 'default-layout',
      title: '@sanity/default-layout',
    },
    {
      name: 'desk-tool',
      title: '@sanity/desk-tool',
    },
    {
      name: 'field',
      title: '@sanity/field',
    },
    {
      name: 'form-builder',
      title: '@sanity/form-builder',
    },
  ],
  features: {
    // navbar: false,
  },
  frameUrl: '/workshop/frame/',
  plugins: [perfPlugin(), a11yPlugin()],
  scopes,
  title: 'Studio Workshop',
})
