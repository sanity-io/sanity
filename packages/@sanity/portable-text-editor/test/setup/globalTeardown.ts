import {teardown as teardownDevServer} from 'jest-dev-server'

export default async function globalTeardown() {
  await teardownDevServer()
}
