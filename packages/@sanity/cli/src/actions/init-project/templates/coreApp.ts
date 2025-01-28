import {type ProjectTemplate} from '../initProject'

const coreAppTemplate: ProjectTemplate = {
  dependencies: {
    '@sanity/sdk': '^0.0.0-alpha',
    '@sanity/sdk-react': '^0.0.0-alpha',
    'react': '^19',
    'react-dom': '^19',
  },
  devDependencies: {
    /*
     * this will be changed to eslint-config sanity,
     *  eslint.config generation will be a fast follow
     */
    '@sanity/eslint-config-studio': '^5.0.1',
    'sanity': '^3',
    '@vitejs/plugin-react': '^4.3.4',
    '@types/react': '^18.0.25',
    'eslint': '^9.9.0',
    'prettier': '^3.0.2',
    'typescript': '^5.1.6',
    'vite': '^6',
  },
  appLocation: './src/App.tsx',
}

export default coreAppTemplate
