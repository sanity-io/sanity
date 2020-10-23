import sortObject from 'deep-sort-object'

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

function getCommonManifest(data) {
  const pkg = {
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

export function createPackageManifest(data) {
  const deps = data.dependencies ? {dependencies: sortObject(data.dependencies)} : {}
  const pkg = Object.assign(
    getCommonManifest(data),
    {
      main: 'package.json',
      keywords: ['sanity'],
      scripts: {
        start: 'sanity start',
        test: 'sanity check',
      },
    },
    deps
  )

  return serializeManifest(pkg)
}

export function createPluginManifest(data, opts = {}) {
  const pkg = Object.assign(getCommonManifest(data), {
    main: 'src/plugin.js',
    scripts: {test: 'echo "Error: no test specified" && exit 1'},
    keywords: ['sanity', 'sanity-plugin'],
    dependencies: {},
  })

  return serializeManifest(pkg)
}

function getSanityPluginManifest(data, {isSanityStyle}) {
  const prefix = data.name.replace(/^sanity-plugin-/, '')
  if (isSanityStyle) {
    return {
      paths: {
        source: './src',
        compiled: './lib',
      },

      parts: [
        {
          name: `part:${prefix}/my-component`,
          path: 'MyComponent.js',
        },
      ],
    }
  }

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

export function createSanityManifest(data, opts) {
  let manifest
  if (opts.isPlugin) {
    manifest = getSanityPluginManifest(data, opts)
  } else {
    manifest = {
      root: true,

      project: {
        name: data.displayName,
      },

      api: {
        projectId: data.projectId,
        dataset: data.dataset,
        token: data.provisionalToken || undefined,
      },

      plugins: [
        '@sanity/base',
        '@sanity/components',
        '@sanity/default-layout',
        '@sanity/default-login',
        '@sanity/desk-tool',
      ],

      env: {
        development: {
          plugins: ['@sanity/vision'],
        },
      },

      parts: [
        {
          name: 'part:@sanity/base/schema',
          path: './schemas/schema',
        },
      ],
    }
  }

  return opts.serialize ? `${JSON.stringify(manifest, null, 2)}\n` : manifest
}

function serializeManifest(src) {
  const props = manifestPropOrder.concat(Object.keys(src))
  const ordered = props.reduce((target, prop) => {
    if (typeof src[prop] !== 'undefined' && typeof target[prop] === 'undefined') {
      target[prop] = src[prop]
    }

    return target
  }, {})

  return `${JSON.stringify(ordered, null, 2)}\n`
}
