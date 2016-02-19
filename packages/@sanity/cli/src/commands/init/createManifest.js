import cliPackage from '../../../package.json'
import ghUrl from 'github-url-to-object'

const manifestPropOrder = [
  'name', 'private', 'version', 'description', 'main', 'author', 'license', 'scripts',
  'keywords', 'dependencies', 'devDependencies'
]

function getCommonManifest(data) {
  const pkg = {
    name: data.name,
    version: '1.0.0',
    description: data.description,
    author: data.author,
    license: data.license,
    devDependencies: {}
  }

  if (pkg.license === 'UNLICENSED') {
    pkg.private = true
  }

  if (data.gitRemote) {
    pkg.repository = {
      type: 'git',
      url: data.gitRemote
    }
  }

  const gh = (data.gitRemote || '').includes('github.com/') && ghUrl(data.gitRemote)
  if (gh) {
    Object.assign(pkg, {
      homepage: `${gh.https_url}#readme`,
      bugs: {url: `${gh.https_url}/issues`}
    })
  }

  return pkg
}

export function createPackageManifest(data) {
  const pkg = Object.assign(getCommonManifest(data), {
    main: 'package.json',
    keywords: ['sanity'],
    scripts: {
      start: 'sanity start',
      test: 'sanity test'
    },
    dependencies: {
      [cliPackage.name]: `^${cliPackage.version}`
    }
  })

  return serializeManifest(pkg)
}

export function createPluginManifest(data) {
  const pkg = Object.assign(getCommonManifest(data), {
    main: 'src/plugin.js',
    scripts: {test: 'echo "Error: no test specified" && exit 1'},
    keywords: ['sanity', 'sanity-plugin'],
    dependencies: {}
  })

  return serializeManifest(pkg)
}

export function createSanityManifest(data) {
  const manifest = {}
  return JSON.stringify(manifest, null, 2)
}

function serializeManifest(src) {
  const props = manifestPropOrder.concat(Object.keys(src))
  const ordered = props.reduce((target, prop) => {
    if (typeof src[prop] !== 'undefined' && typeof target[prop] === 'undefined') {
      target[prop] = src[prop]
    }

    return target
  }, {})

  return JSON.stringify(ordered, null, 2)
}
