import {describe, test} from '@jest/globals'

import {cliUserToken, hasBuiltCli} from './environment'

type ProvidesCallback = () => Promise<unknown>

// only run cli tests if we have an environment variable set with the cli auth token
export const describeCliTest: typeof describe.skip =
  cliUserToken && hasBuiltCli ? describe : describe.skip

// test.concurrent() runs even if the parent describe is skipped, so we need to wrap it as well
export const testConcurrent = (name: string, testFn: ProvidesCallback, timeout = 30000): void => {
  const tester = cliUserToken && hasBuiltCli ? test.concurrent : test.concurrent.skip
  return tester(name, testFn, timeout)
}
