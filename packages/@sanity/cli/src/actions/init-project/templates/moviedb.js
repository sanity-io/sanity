export const importPrompt = 'Add a sampling of sci-fi movies to your dataset on the hosted backend?'
export const datasetUrl = 'https://public.sanity.io/moviesdb-2018-03-06.tar.gz'

export const dependencies = {
  '@sanity/google-maps-input': '^1.2.0',
  '@sanity/icons': '^1.0.9',
}

export const generateSanityManifest = (base) => ({
  ...base,
  plugins: base.plugins.concat(['@sanity/google-maps-input']),
})
