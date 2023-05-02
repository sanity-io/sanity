export const studioDependencies = {
  // Dependencies for a default Sanity installation
  dependencies: {
    // Official studio dependencies
    sanity: 'latest',

    // Official studio plugin dependencies
    '@sanity/vision': 'latest',

    // Non-Sanity dependencies
    react: '^18.2.0',
    'react-dom': '^18.2.0',
    'react-is': '^18.2.0', // Peer dependency of styled-components
    'styled-components': '^5.3.9',
  },

  devDependencies: {
    // Linting/tooling
    '@sanity/eslint-config-studio': 'latest',
    // When using typescript, we'll want the these types too, so might as well install them
    '@types/react': '^18.0.25',
    '@types/styled-components': '^5.1.26',
    eslint: '^8.6.0',
    prettier: '^2.8.8',
    typescript: '^4.9.5', // Peer dependency of eslint-config-studio (implicitly)
  },
}
