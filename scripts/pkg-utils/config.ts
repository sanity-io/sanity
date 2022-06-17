import path from 'path'

export interface ExportConfig {
  target?: 'node' | undefined
}

export interface PkgUtilsConfig {
  exportsCheck?: Record<string, ExportConfig | undefined>
}

export function getPkgUtilsConfig(opts: {cwd: string}): PkgUtilsConfig {
  try {
    return require(path.join(opts.cwd, 'pkg-utils.config.js'))
  } catch (err) {
    return {}
  }
}
