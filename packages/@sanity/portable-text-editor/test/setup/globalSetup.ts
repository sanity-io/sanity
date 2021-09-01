import path from 'path'

import {setup as setupDevServer} from 'jest-dev-server'

const testFolderPath = path.join(__dirname, '../')

module.exports = async function globalSetup() {
  await setupDevServer([
    {
      command: `vite ${testFolderPath}/web-server`,
      launchTimeout: 10000,
      port: 3000,
    },
    {
      command: `ts-node ${testFolderPath}/ws-server`,
      launchTimeout: 10000,
      port: 3001,
    },
  ])
}
