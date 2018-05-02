export const importPrompt = 'Import a sampling of products to start your e-commerce project?'
export const datasetUrl = 'https://public.sanity.io/ecommerce-2018-05-02.tar.gz'

export const dependencies = {
  'react-barcode': '^1.3.2'
}

export const generateSanityManifest = base => ({
  ...base,
  plugins: base.plugins.concat(['barcode-input'])
})
