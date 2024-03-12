import {definePlugin} from 'sanity'

import {AddonDatasetStudioLayout} from './AddonDatasetStudioLayout'

export const addonDataset = definePlugin({
  name: 'sanity/structure/addon-dataset',

  studio: {
    components: {
      layout: AddonDatasetStudioLayout,
    },
  },
})
