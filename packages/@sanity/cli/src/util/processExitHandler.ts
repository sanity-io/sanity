export class ProcessExitError extends Error {
  public readonly exitCode: number | undefined
  public readonly name = 'ProcessExitError'
  constructor(exitCode: number | undefined) {
    super('Process exit')
    this.exitCode = exitCode
  }
}

/**
 * This is a bit of a hack, but since the CLI makes extensive use of calling process.exit(<exitcode>) to prevent
 * further execution, we need to patch process.exit in order to be able to send telemetry
 * @param finalTask - the async task to run on process.exit
 */
export function installProcessExitHandler(finalTask: () => Promise<unknown>) {
  const originalProcessExit = process.exit

  process.on('uncaughtException', (reason) => {
    if (reason instanceof ProcessExitError) {
      finalTask().finally(() => originalProcessExit(reason.exitCode))
    } else {
      throw reason
    }
  })
  // since the expectation is that process.exit() stops further code execution,
  // this has to throw.
  // This error is caught by the unCaughtExeption handler installed above
  process.exit = (exitCode?: number | undefined): never => {
    throw new ProcessExitError(exitCode)
  }
}
