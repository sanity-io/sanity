import {a11yPlugin, defineConfig, perfPlugin} from '@sanity/ui-workshop'
import {scopes} from './scopes'

export const config = defineConfig({
  frameUrl: '/workshop/frame/',
  plugins: [perfPlugin(), a11yPlugin()],
  scopes: scopes.filter(Boolean),
  title: 'Sanity Workshop',
})
