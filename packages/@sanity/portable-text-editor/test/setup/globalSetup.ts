import path from 'path'
import {setup as setupDevServer} from 'jest-dev-server'

const testFolderPath = path.resolve(__dirname, '..')

export default async function globalSetup() {
  await setupDevServer([
    {
      command: `vite --port 3000 ${testFolderPath}/web-server`,
      launchTimeout: 10000,
    },
    {
      command: `node --experimental-loader esbuild-register/loader -r esbuild-register ${testFolderPath}/ws-server`,
      launchTimeout: 10000,
      port: 3001,
      debug: true,
    },
  ])
}
