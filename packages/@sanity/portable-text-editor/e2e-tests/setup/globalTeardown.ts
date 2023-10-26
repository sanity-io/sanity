import {teardown as teardownDevServer} from 'jest-dev-server'

export default async function globalTeardown(): Promise<void> {
  await teardownDevServer(globalThis.servers)
}
