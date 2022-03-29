// @todo REPLACE ME ONCE WE GO LIVE
const V3_TAG = 'purple-unicorn'

export default {
  // Dependencies for a default Sanity installation
  core: {
    // Official studio dependencies
    sanity: V3_TAG,

    // Non-Sanity dependencies
    react: '^17.0.0',
    'react-dom': '^17.0.0',
    'styled-components': '^5.2.0',

    // Linting
    '@sanity/eslint-config-studio': 'latest',
    eslint: '^8.6.0',
  },
}
