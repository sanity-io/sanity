const V3_TAG = 'purple-unicorn'

export default {
  // Dependencies for a default Sanity installation
  core: {
    '@sanity/base': V3_TAG,
    '@sanity/core': V3_TAG,
    '@sanity/desk-tool': V3_TAG,
    '@sanity/vision': V3_TAG,

    // Non-Sanity dependencies
    react: '^17.0.0',
    'react-dom': '^17.0.0',
    'styled-components': '^5.2.0',

    // Linting
    '@sanity/eslint-config-studio': 'latest',
    eslint: '^8.6.0',
  },
}
