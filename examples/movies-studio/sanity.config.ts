import {defineConfig} from 'sanity'
import {deskTool} from 'sanity/desk'
import {googleMapsInput} from '@sanity/google-maps-input'

import {schemaTypes} from '../../packages/@sanity/cli/templates/moviedb/schemas'
import {BrandLogo} from './components/BrandLogo'

export default defineConfig({
  name: 'default',
  title: 'Movies Unlimited',

  projectId: 'zp7mbokg',
  dataset: 'production',

  schema: {
    types: schemaTypes,
  },

  logo: BrandLogo,

  plugins: [
    deskTool(),
    googleMapsInput({
      apiKey: 'AIzaSyDDO2FFi5wXaQdk88S1pQUa70bRtWuMhkI',
      defaultZoom: 11,
      defaultLocation: {
        lat: 40.7058254,
        lng: -74.1180863,
      },
    }),
  ],

  document: {
    // @todo
    //productionUrl: resolveProductionUrl,
  },
})
