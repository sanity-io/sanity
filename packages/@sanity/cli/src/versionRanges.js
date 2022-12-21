export default {
  // Dependencies for a default Sanity installation
  core: {
    '@sanity/base': '^2.0.0',
    '@sanity/core': '^2.0.0',
    '@sanity/default-layout': '^2.0.0',
    '@sanity/default-login': '^2.0.0',
    '@sanity/desk-tool': '^2.0.0',
    '@sanity/eslint-config-studio': '^2.0.0',
    '@sanity/vision': '^2.0.0',
    eslint: '^8.6.0',
    'prop-types': '^15.7',
    react: '^17.0',
    'react-dom': '^17.0',
    'styled-components': '^5.2.0',
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
      eslint: '^3.4.0',
      'eslint-config-sanity': '^1.1.3',
      'eslint-plugin-react': '^6.3.0',
      rimraf: '^2.5.2',
    },
  },
}
