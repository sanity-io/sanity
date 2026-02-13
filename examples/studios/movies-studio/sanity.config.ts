import {googleMapsInput} from '@sanity/google-maps-input'
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'

import {BrandLogo} from './components/BrandLogo'
import {schemaTypes} from './schemaTypes'

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
    structureTool(),
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
