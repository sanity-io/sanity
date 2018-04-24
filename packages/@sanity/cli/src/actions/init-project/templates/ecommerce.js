export const importPrompt = 'Import a sampling of products to start your e-commerce project?'
export const datasetUrl = 'https://public.sanity.io/ecommerce-2018-04-24.tar.gz'

export const dependencies = {
  canvas: '^1.6.10',
  jsbarcode: '^3.9.0',
  'react-barcode': '^1.3.2'
}

export const generateSanityManifest = base => ({
  ...base,
  plugins: base.plugins.concat(['barcode-input'])
})
