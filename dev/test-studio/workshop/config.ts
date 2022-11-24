import {WorkshopConfig} from '@sanity/ui-workshop'
import {a11yPlugin} from '@sanity/ui-workshop/plugin-a11y'
import {perfPlugin} from '@sanity/ui-workshop/plugin-perf'
import {scopes} from './scopes'

export const config: WorkshopConfig = {
  frameUrl: '/workshop/frame/',
  plugins: [perfPlugin(), a11yPlugin()],
  scopes: scopes.filter(Boolean),
  title: 'Sanity Workshop',
}
