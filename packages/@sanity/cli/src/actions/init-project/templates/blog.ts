import type {SanityJson} from '../../../types'

export const dependencies = {}

export const generateSanityManifest = (base: SanityJson): SanityJson => ({
  ...base,
  plugins: base.plugins,
})
