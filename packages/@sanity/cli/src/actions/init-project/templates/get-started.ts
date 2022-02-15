import type {SanityJson} from '../../../types'

export const dependencies = {}

export const generateSanityManifest = (base: SanityJson): SanityJson => ({
  ...base,
  parts: [
    {
      name: 'part:@sanity/base/schema',
      path: './schemas/schema',
    },
    {
      implements: 'part:@sanity/base/root',
      path: 'plugins/sanity-plugin-tutorial/CustomDefaultLayout',
    },
  ],
})
