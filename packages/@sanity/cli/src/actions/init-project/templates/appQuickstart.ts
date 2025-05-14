import {type ProjectTemplate} from '../initProject'

const appTemplate: ProjectTemplate = {
  dependencies: {
    '@sanity/sdk': '^1',
    '@sanity/sdk-react': '^1',
    'react': '^19',
    'react-dom': '^19',
  },
  devDependencies: {
    '@types/react': '^18.0.25',
    'sanity': '^3',
    'typescript': '^5.1.6',
  },
  entry: './src/App.tsx',
  scripts: {
    dev: 'sanity dev',
    build: 'sanity build',
    start: 'sanity start',
  },
}

export default appTemplate
