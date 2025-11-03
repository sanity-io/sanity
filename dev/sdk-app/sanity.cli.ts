import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  app: {
    entry: './src/App.tsx',
    organizationId: 'oblZgbTFj',
  },
  deployment: {
    autoUpdates: true,
    appId: 'xfhnlcpqjeejdaspev3qr7an',
  },
})
