import {type ProjectTemplate} from '../initProject'

const appSanityUiTemplate: ProjectTemplate = {
  dependencies: {
    '@sanity/sdk': '^0.0.0-rc',
    '@sanity/sdk-react': '^0.0.0-rc',
    '@sanity/ui': '^2',
    'react': '^19',
    'react-dom': '^19',
    'styled-components': '^6.1.17',
  },
  devDependencies: {
    /*
     * this will be changed to eslint-config sanity,
     *  eslint.config generation will be a fast follow
     */
    '@sanity/eslint-config-studio': '^5.0.1',
    '@types/react': '^18.0.25',
    'eslint': '^9.9.0',
    'prettier': '^3.0.2',
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

export default appSanityUiTemplate
