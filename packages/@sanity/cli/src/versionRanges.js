export default {
  // Dependencies for a default Sanity installation
  core: {
    '@sanity/base': 'latest',
    '@sanity/components': 'latest',
    '@sanity/core': 'latest',
    '@sanity/default-layout': 'latest',
    '@sanity/default-login': 'latest',
    '@sanity/desk-tool': 'latest',
    '@sanity/vision': 'latest',
    react: '^16.2',
    'react-dom': '^16.2',
    'prop-types': '^15.6',
  },

  // Only used for Sanity-style plugins (eg, the ones we build at Sanity.io)
  plugin: {
    dev: {
      '@sanity/check': 'latest',
      'babel-cli': '^6.9.0',
      'babel-eslint': '^6.0.4',
      'babel-plugin-syntax-class-properties': '^6.8.0',
      'babel-plugin-transform-class-properties': '^6.9.1',
      'babel-preset-es2015': '^6.9.0',
      'babel-preset-react': '^6.5.0',
      eslint: '^3.4.0',
      'eslint-config-sanity': '^1.1.3',
      'eslint-plugin-react': '^6.3.0',
      rimraf: '^2.5.2',
    },
  },
}
