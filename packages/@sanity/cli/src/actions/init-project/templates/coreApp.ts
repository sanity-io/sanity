import {type ProjectTemplate} from '../initProject'

const coreAppTemplate: ProjectTemplate = {
  dependencies: {
    '@sanity/sdk': '^0.0.0-alpha',
    '@sanity/sdk-react': '^0.0.0-alpha',
  },
  devDependencies: {
    'vite': '^6',
    '@vitejs/plugin-react': '^4.3.4',
  },
}

export default coreAppTemplate
