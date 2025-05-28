import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  app: {
    organizationId: 'mockOrgId',
    entry: './src/App.tsx',
  },
})
