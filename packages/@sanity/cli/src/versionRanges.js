export default {
  // Dependencies for a default Sanity installation
  core: {
    '@sanity/base': '^0.0.17',
    '@sanity/components': '^0.0.11',
    '@sanity/default-layout': '^0.0.4',
    '@sanity/default-login': '^0.0.2',
    '@sanity/desk-tool': '^0.1.3',
    'react': '^15.3.0',
    'react-dom': '^15.3.0'
  },

  // Only used for Sanity-style plugins (eg, the ones we build at Sanity.io)
  plugin: {
    dev: {
      '@sanity/check': '^0.0.2',
      'babel-cli': '^6.9.0',
      'babel-eslint': '^6.0.4',
      'babel-plugin-syntax-class-properties': '^6.8.0',
      'babel-plugin-transform-class-properties': '^6.9.1',
      'babel-preset-es2015': '^6.9.0',
      'babel-preset-react': '^6.5.0',
      'eslint': '^3.4.0',
      'eslint-config-sanity': '^1.1.3',
      'eslint-plugin-react': '^6.3.0',
      'rimraf': '^2.5.2'
    },
    prod: {
      'in-publish': '^2.0.0'
    }
  }
}
