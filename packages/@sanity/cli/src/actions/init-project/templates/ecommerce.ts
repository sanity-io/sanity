import type {SanityJson} from '../../../types'

export const importPrompt = 'Upload a sampling of products to go with your e-commerce schema?'
export const datasetUrl = 'https://public.sanity.io/ecommerce-2018-05-02.tar.gz'

export const dependencies = {
  'react-barcode': '^1.3.2',
}

export const generateSanityManifest = (base: SanityJson): SanityJson => ({
  ...base,
  plugins: (base.plugins || []).concat(['barcode-input']),
})
