export default {
  // Dependencies for a default Sanity installation
  core: {
    '@sanity/base': '^2.1.49',
    '@sanity/components': '^1.0.21',
    '@sanity/default-layout': '^1.0.15',
    '@sanity/default-login': '^1.0.0',
    '@sanity/desk-tool': '^1.0.28',
    'react': '^15.0.1',
    'react-dom': '^15.0.1'
  },

  // Only used for Sanity-style plugins (eg, the ones we build at Sanity.io)
  plugin: {
    dev: {
      'babel-cli': '^6.9.0',
      'babel-eslint': '^6.0.4',
      'babel-plugin-syntax-class-properties': '^6.8.0',
      'babel-plugin-transform-class-properties': '^6.9.1',
      'babel-preset-es2015': '^6.9.0',
      'babel-preset-react': '^6.5.0',
      'eslint': '^2.12.0',
      'eslint-config-sanity': '^1.1.1',
      'eslint-plugin-react': '^5.1.1',
      'rimraf': '^2.5.2'
    },
    prod: {
      'in-publish': '^2.0.0'
    }
  }
}
