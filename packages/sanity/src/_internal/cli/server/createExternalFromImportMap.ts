import {escapeRegExp} from 'lodash'

type ImportMap = {imports?: Record<string, string>}

/**
 * Generates a Rollup `external` configuration array based on the provided
 * import map. We derive externals from the import map because this ensures that
 * modules listed in the import map are not bundled into the Rollup output so
 * the browser can load these bare specifiers according to the import map.
 */
export function createExternalFromImportMap({imports = {}}: ImportMap = {}): (string | RegExp)[] {
  return Object.keys(imports).map((specifier) =>
    specifier.endsWith('/') ? new RegExp(`^${escapeRegExp(specifier)}.+`) : specifier,
  )
}
