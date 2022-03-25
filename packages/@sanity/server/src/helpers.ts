import path from 'path'
import readPkgUp from 'read-pkg-up'
import resolveFrom from 'resolve-from'

/**
 * Given a module name such as "styled-components", will resolve the _module path_,
 * eg if require.resolve(`styled-components`) resolves to:
 *   `/some/node_modules/styled-components/lib/cjs/styled.js`
 * this function will instead return
 *   `/some/node_modules/styled-components`
 *
 * This is done in order for aliases to be pointing to the right module in terms of
 * _file-system location_, without pointing to a specific commonjs/browser/module variant
 *
 * @internal
 */
export async function getModulePath(mod: string, fromDir: string): Promise<string> {
  const modulePath = resolveFrom(fromDir, mod)
  const pkg = await readPkgUp({cwd: path.dirname(modulePath)})

  return pkg ? path.dirname(pkg.path) : modulePath
}

/**
 * @internal
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

/**
 * Ensures that the given path both starts and ends with a single slash
 *
 * @internal
 */
export function normalizeBasePath(pathName: string): string {
  return `/${pathName}/`.replace(/^\/+/, '/').replace(/\/+$/, '/')
}
