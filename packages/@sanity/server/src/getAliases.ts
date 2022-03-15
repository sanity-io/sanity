import path from 'path'
import readPkgUp from 'read-pkg-up'
import resolveFrom from 'resolve-from'

export async function getAliases(cwd: string): Promise<Record<string, string>> {
  const [reactPath, reactDomPath, styledComponentsPath] = await Promise.all([
    getModulePath('react', cwd),
    getModulePath('react-dom', cwd),
    getModulePath('styled-components', cwd),
  ])

  return {
    $config: path.resolve(cwd, 'sanity.config.ts'),
    react: reactPath,
    '@sanity/base': path.resolve(__dirname, '../../base/src/_exports'),
    '/$studio': path.resolve(__dirname, '../src/app/main.tsx'),
    'react/jsx-dev-runtime': `${reactPath}/jsx-dev-runtime`,
    'styled-components': styledComponentsPath,

    // @todo For some reason this doesn't work, failing because react-dom
    // is not an ESM module. Need to investigate this more.
    // 'react-dom': reactDomPath,
  }
}

async function getModulePath(mod: string, fromDir: string): Promise<string> {
  const modulePath = resolveFrom(fromDir, mod)
  const pkg = await readPkgUp({cwd: path.dirname(modulePath)})
  return pkg ? path.dirname(pkg.path) : modulePath
}
