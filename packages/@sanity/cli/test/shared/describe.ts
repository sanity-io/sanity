import {cliUserToken, hasBuiltCli} from './environment'

// From jest typings, not exposed by jest
interface DoneCallback {
  (...args: unknown[]): unknown
  fail(error?: string | {message: string}): unknown
}

type ProvidesCallback = ((cb: DoneCallback) => void | undefined) | (() => Promise<unknown>)

// only run cli tests if we have an environment variable set with the cli auth token
export const describeCliTest = cliUserToken && hasBuiltCli ? describe : describe.skip

// test.concurrent() runs even if the parent describe is skipped, so we need to wrap it as well
export const testConcurrent = (name: string, testFn: ProvidesCallback, timeout = 30000): void => {
  const tester = cliUserToken && hasBuiltCli ? test.concurrent : test.concurrent.skip
  return tester(name, testFn, timeout)
}
