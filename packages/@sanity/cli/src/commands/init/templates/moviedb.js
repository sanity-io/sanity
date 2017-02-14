export const dependencies = {
  '@sanity/date-input': '^0.99.0',
  '@sanity/google-maps-input': '^0.99.0',
}

export const generateSanityManifest = base => ({
  ...base,

  plugins: base.plugins.concat([
    '@sanity/date-input',
    '@sanity/google-maps-input',
  ])
})
