import path from 'path'
import pkgDir from 'pkg-dir'

/**
 * Because we're bundling the CLI into a single file, the classic approach of
 * checking `isMainThread()` and spawning a thread on `__dirname` does not work,
 * as it leads to the entire CLI being re-executed in the worker thread.
 *
 * To make things worse, the built CLI makes it difficult to resolve paths to
 * built source files (that contains the unpackaged worker).
 *
 * This function takes a path relative to the `src/workers` folder, resolves
 * the location of that within the installed location (eg global Sanity CLI)
 * and ensures we can resolve the actual module before trying to spawn the
 * worker thread.
 *
 * @param workerPath - _RELATIVE_ path (relative to `src/workers`) to the worker
 * @returns Full, absolute path to the worker
 * @internal
 */
export async function getCliWorkerPath(workerPath: string): Promise<string> {
  const cliDir = await pkgDir(__dirname)
  if (!cliDir) {
    throw new Error('Failed to find root @sanity/cli module directory')
  }

  const resolvedPath = path.resolve(cliDir, 'lib', 'workers', workerPath)
  try {
    return require.resolve(resolvedPath)
  } catch (err) {
    throw new Error(`Unable to resolve path for worker: ${workerPath}`)
  }
}
