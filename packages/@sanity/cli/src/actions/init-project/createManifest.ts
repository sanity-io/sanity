import sortObject from 'deep-sort-object'
import type {PackageJson, SanityJson} from '../../types'

const manifestPropOrder = [
  'name',
  'private',
  'version',
  'description',
  'main',
  'author',
  'license',
  'scripts',
  'keywords',
  'dependencies',
  'devDependencies',
]

function getCommonManifest(data: Omit<PackageJson, 'version'> & {gitRemote?: string}) {
  const pkg: PackageJson = {
    name: data.name,
    version: '1.0.0',
    description: data.description,
    author: data.author,
    license: data.license,
    devDependencies: {},
  }

  if (pkg.license === 'UNLICENSED') {
    pkg.private = true
  }

  if (data.gitRemote) {
    pkg.repository = {
      type: 'git',
      url: data.gitRemote,
    }
  }

  return pkg
}

export function createPackageManifest(
  data: Omit<PackageJson, 'version'> & {gitRemote?: string}
): string {
  const deps = data.dependencies ? {dependencies: sortObject(data.dependencies)} : {}
  const pkg = {
    ...getCommonManifest(data),

    main: 'package.json',
    keywords: ['sanity'],
    scripts: {
      start: 'sanity start',
      build: 'sanity build',
    },

    ...deps,
  }

  return serializeManifest(pkg)
}

export function createPluginManifest(data: PackageJson & {gitRemote?: string}): string {
  const pkg = {
    ...getCommonManifest(data),
    main: 'src/plugin.js',
    scripts: {test: 'echo "Error: no test specified" && exit 1'},
    keywords: ['sanity', 'sanity-plugin'],
    dependencies: {},
  }

  return serializeManifest(pkg)
}

function getSanityPluginManifest(data: {name: string}): SanityJson {
  const prefix = data.name.replace(/^sanity-plugin-/, '')
  return {
    parts: [
      {
        implements: `part:${prefix}/my-component`,
        description:
          'Description for this role. Change `implements` to `name` if it should be non-overridable.',
        path: 'lib/MyComponent.js',
      },
    ],
  }
}

export function createSanityManifest(
  data: Omit<PackageJson, 'version'> & {displayName: string; projectId: string; dataset: string},
  options?: {isPlugin?: boolean}
): SanityJson {
  let manifest: string | SanityJson
  if (options && options.isPlugin) {
    manifest = getSanityPluginManifest(data)
  } else {
    manifest = {
      root: true,

      project: {
        name: data.displayName,
      },

      api: {
        projectId: data.projectId,
        dataset: data.dataset,
      },

      plugins: [
        '@sanity/base',
        '@sanity/default-layout',
        '@sanity/default-login',
        '@sanity/desk-tool',
      ],

      env: {
        development: {
          plugins: ['@sanity/vision'],
        },
      },

      parts: data.parts || [
        {
          name: 'part:@sanity/base/schema',
          path: './schemas/schema',
        },
      ],
    }
  }

  return manifest
}

function serializeManifest(src: PackageJson | SanityJson): string {
  const props = manifestPropOrder.concat(Object.keys(src))
  const ordered = props.reduce((target, prop) => {
    const source = src as any
    if (typeof source[prop] !== 'undefined' && typeof target[prop] === 'undefined') {
      target[prop] = source[prop]
    }

    return target
  }, {} as Record<string, any>)

  return `${JSON.stringify(ordered, null, 2)}\n`
}
