// @todo REPLACE ME ONCE WE GO LIVE
const V3_TAG = 'dev-preview'

export const studioDependencies = {
  // Dependencies for a default Sanity installation
  dependencies: {
    // Official studio dependencies
    sanity: V3_TAG,

    // Non-Sanity dependencies
    react: '^18.2.0',
    'react-dom': '^18.2.0',
    'react-is': '^18.2.0', // Peer dependency of styled-components
    'styled-components': '^5.2.0',
  },

  devDependencies: {
    // Linting/tooling
    '@sanity/eslint-config-studio': 'latest',
    eslint: '^8.6.0',
    prettier: 'latest',
    typescript: '^4.0.0', // Peer dependency of eslint-config-studio (implicitly)
  },
}
