export const importPrompt = 'Import a sampling of sci-fi movies to go with your movie schema?'
export const datasetUrl = 'https://public.sanity.io/moviesdb-2018-06-13.tar.gz'

export const dependencies = {
  '@sanity/google-maps-input': '^0.99.0',
  'react-icons': '^2.2.5'
}

export const generateSanityManifest = base => ({
  ...base,
  plugins: base.plugins.concat(['@sanity/google-maps-input'])
})
