export const studioDependencies = {
  // Dependencies for a default Sanity installation
  dependencies: {
    // Official studio dependencies
    'sanity': 'latest',

    // Official studio plugin dependencies
    '@sanity/vision': 'latest',

    // Non-Sanity dependencies
    'react': '^18.2.0',
    'react-dom': '^18.2.0',
    'styled-components': '^6.1.8',
  },

  devDependencies: {
    // Linting/tooling
    '@sanity/eslint-config-studio': 'latest',
    // When using typescript, we'll want the these types too, so might as well install them
    '@types/react': '^18.0.25',
    'eslint': '^9.9.0',
    'prettier': '^3.0.2',
    'typescript': '^5.1.6', // Peer dependency of eslint-config-studio (implicitly)
  },
}
