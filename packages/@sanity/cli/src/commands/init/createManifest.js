import cliPackage from '../../../package.json'

export function createPackageManifest(data) {
  const pkg = {
    name: data.name,
    private: true,
    version: '1.0.0',
    description: data.description,
    main: 'package.json',
    scripts: {
      start: 'sanity start',
      test: 'sanity test'
    },
    keywords: ['sanity'],
    author: data.author,
    license: 'UNLICENSED',
    dependencies: {
      [cliPackage.name]: `^${cliPackage.version}`
    },
    devDependencies: {}
  }

  if (data.gitRemote) {
    pkg.repository = {
      type: 'git',
      url: data.gitRemote
    }
  }

  return JSON.stringify(pkg, null, 2)
}

export function createSanityManifest(data) {
  const manifest = {}
  return JSON.stringify(manifest, null, 2)
}
