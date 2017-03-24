export default {
  // Dependencies for a default Sanity installation
  core: {
    '@sanity/base': '^0.99.0',
    '@sanity/components': '^0.99.0',
    '@sanity/core': '^0.99.0',
    '@sanity/default-layout': '^0.99.0',
    '@sanity/default-login': '^0.99.0',
    '@sanity/desk-tool': '^0.99.0',
    react: '^15.4.2',
    'react-dom': '^15.4.2'
  },

  // Only used for Sanity-style plugins (eg, the ones we build at Sanity.io)
  plugin: {
    dev: {
      '@sanity/check': '^0.99.0',
      'babel-cli': '^6.9.0',
      'babel-eslint': '^6.0.4',
      'babel-plugin-syntax-class-properties': '^6.8.0',
      'babel-plugin-transform-class-properties': '^6.9.1',
      'babel-preset-es2015': '^6.9.0',
      'babel-preset-react': '^6.5.0',
      eslint: '^3.4.0',
      'eslint-config-sanity': '^1.1.3',
      'eslint-plugin-react': '^6.3.0',
      rimraf: '^2.5.2'
    },
    prod: {
      'in-publish': '^2.0.0'
    }
  }
}
