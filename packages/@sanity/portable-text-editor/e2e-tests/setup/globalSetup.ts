import path from 'path'
import {setup as setupDevServer} from 'jest-dev-server'

const testFolderPath = path.resolve(__dirname, '..')

declare global {
  // eslint-disable-next-line no-var
  var servers: any[] // For the globalSetup and globalTeardown script
}

export default async function globalSetup(): Promise<void> {
  globalThis.servers = await setupDevServer([
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
