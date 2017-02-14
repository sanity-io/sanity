// Note: Must be Node 4 compatible
exports.dependencies = {
  '@sanity/date-input': '^0.99.0',
  '@sanity/google-maps-input': '^0.99.0',
}

exports.generateSanityManifest = base => Object.assign({}, base, {
  plugins: base.plugins.concat([
    '@sanity/date-input',
    '@sanity/google-maps-input',
  ])
})
