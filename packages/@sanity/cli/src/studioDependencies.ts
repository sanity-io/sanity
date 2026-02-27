export const studioDependencies = {
  // Dependencies for a default Sanity installation
  dependencies: {
    // Official studio dependencies
    'sanity': 'latest',

    // Official studio plugin dependencies
    '@sanity/vision': 'latest',

    // Non-Sanity dependencies
    'react': '^19.1',
    'react-dom': '^19.1',
    'styled-components': '^6.1.18',
  },

  devDependencies: {
    // Linting/tooling
    '@sanity/eslint-config-studio': 'latest',
    // When using typescript, we'll want the these types too, so might as well install them
    '@types/react': '^19.1',
    'eslint': '^9.28',
    'prettier': '^3.5',
    'typescript': '^5.8', // Peer dependency of eslint-config-studio (implicitly)
  },
}
