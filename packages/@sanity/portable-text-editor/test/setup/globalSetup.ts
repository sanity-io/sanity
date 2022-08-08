const path = require('path')
const {setup: setupDevServer} = require('jest-dev-server')

const testFolderPath = path.resolve(__dirname, '..')

module.exports = async function globalSetup() {
  await setupDevServer([
    {
      command: `vite --port 3000 ${testFolderPath}/web-server`,
      launchTimeout: 10000,
    },
    {
      command: `node -r esbuild-register ${testFolderPath}/ws-server`,
      launchTimeout: 10000,
      port: 3001,
      debug: true,
    },
  ])
}
