import merge from 'lodash/merge'

function sanityManifest(plugins, parts, opts = {}) {
  return JSON.stringify(
    {
      root: opts.root,
      server: {
        port: 7777,
      },
      plugins: plugins || [],
      parts: parts,
    },
    null,
    2
  )
}

function pluginManifest(props) {
  return JSON.stringify(props, null, 2)
}

function instagramManifest() {
  return pluginManifest({
    paths: {
      source: 'src',
      compiled: 'lib',
    },

    parts: [
      {
        name: 'part:instagram/commentsList',
        description: 'List of comments...',
      },
      {
        name: 'part:instagram/comment',
        description: 'A comment on instagram',
      },
      {
        implements: 'part:instagram/commentsList',
        path: 'components/CommentsList',
      },
      {
        implements: 'part:instagram/comment',
        path: 'components/Comment',
      },
      {
        name: 'part:instagram/instagramTool',
        implements: 'part:@sanity/default-layout/tool',
        path: 'components/InstagramTool',
      },
      {
        name: 'part:instagram/instagramDiscoverTool',
        implements: 'part:@sanity/default-layout/tool',
        path: 'components/InstaDiscoverTool',
      },
    ],
  })
}

function defaultLayout() {
  return {
    'sanity.json': pluginManifest({
      paths: {
        source: 'src',
        compiled: 'lib',
      },

      parts: [
        {
          name: 'part:@sanity/default-layout/tool',
          description: 'A generic UI tool',
        },
        {
          name: 'part:@sanity/default-layout/settingsPane',
          description: 'One "tab" of the default layout settings',
        },
        {
          implements: 'part:@sanity/core/root',
          path: 'components/Root',
        },
      ],
    }),
  }
}

function sanityCore() {
  return {
    core: {
      'sanity.json': pluginManifest({
        plugins: ['@sanity/default-layout'],
        parts: [
          {
            name: 'part:@sanity/core/root',
            description: 'The main component in the UI hierarchy. Usually a layout.',
          },
        ],
      }),
    },
    'default-layout': defaultLayout(),
  }
}

export function getResolutionOrderFixture({chosenMethod}) {
  const order = ['fullLocalPath', 'shortLocalPath', 'subNodeModules', 'nodeModules']
  const paths = {
    fullLocalPath: '/sanity/plugins/sanity-plugin-bar/sanity.json',
    shortLocalPath: '/sanity/plugins/bar/sanity.json',
    subNodeModules:
      '/sanity/node_modules/sanity-plugin-foo/node_modules/sanity-plugin-bar/sanity.json',
    nodeModules: '/sanity/node_modules/sanity-plugin-bar/sanity.json',
  }

  const base = {
    '/sanity/sanity.json': sanityManifest(['foo'], [], {root: true}),
    '/sanity/node_modules/sanity-plugin-foo/sanity.json': pluginManifest({plugins: ['bar']}),
  }

  const extendWith = {}
  const startIndex = order.indexOf(chosenMethod)
  for (let i = startIndex; i < order.length; i++) {
    const method = order[i]
    extendWith[paths[method]] = pluginManifest({})
  }

  return Object.assign({}, base, extendWith)
}

export function getDuplicatePartTree() {
  return {
    '/sanity/sanity.json': sanityManifest(['snarkel', 'snuffel']),
    '/sanity/plugins': {
      snarkel: {
        'sanity.json': pluginManifest({
          parts: [
            {
              name: 'part:snarkel/foo',
              description: 'Foo',
            },
          ],
        }),
      },
      snuffel: {
        'sanity.json': pluginManifest({
          parts: [
            {
              name: 'part:snarkel/foo',
              description: 'Dupe',
            },
          ],
        }),
      },
    },
  }
}

export function getDuplicatePluginTree() {
  return {
    '/sanity/sanity.json': sanityManifest(['form-builder', 'google-maps-input']),
    '/sanity/plugins': {
      'form-builder': {
        'sanity.json': pluginManifest({
          plugins: ['google-maps-input'],
          parts: [
            {
              name: 'part:form-builder/thing',
              description: 'Yup',
            },
          ],
        }),
      },
      'google-maps-input': {
        'sanity.json': pluginManifest({
          parts: [
            {
              name: 'part:google-maps-input/thing',
              description: 'Map thing',
              path: './Thing.js',
            },
          ],
        }),
      },
    },
  }
}

export function getBasicTree() {
  return {
    '/sanity/sanity.json': sanityManifest(['@sanity/core', 'instagram']),
    '/sanity/node_modules': {
      'sanity-plugin-instagram': {
        'sanity.json': instagramManifest(),
      },
      '@sanity': sanityCore(),
    },
  }
}

export function getMixedPluginTree() {
  return {
    '/sanity/sanity.json': sanityManifest(['@sanity/core', 'instagram', 'foo']),
    '/sanity/node_modules': {
      'sanity-plugin-instagram': {
        'sanity.json': instagramManifest(),
      },
      '@sanity': sanityCore(),
    },
    '/sanity/plugins': {
      foo: {
        'sanity.json': pluginManifest({
          paths: {
            compiled: './lib',
            source: './src',
          },

          parts: [
            {
              implements: 'part:@sanity/default-layout/tool',
              path: 'File',
            },
            {
              implements: 'part:instagram/commentsList',
              path: 'InstaComments',
            },
          ],
        }),
      },
    },
  }
}

export function getPathAlternatives() {
  return {
    '/sanity/sanity.json': sanityManifest(['foo']),
    '/sanity/plugins': {
      foo: {
        'sanity.json': pluginManifest({
          paths: {
            compiled: './lib',
            source: './src',
          },

          parts: [
            {
              implements: 'part:foo/relative',
              path: 'relative/Path.js',
            },
            {
              implements: 'part:foo/absolute',
              path: '/absolute/path/to/File.js',
            },
            {
              implements: 'part:foo/dot-path',
              path: './locale/en-us.json',
            },
          ],
        }),
      },
    },
  }
}

export function getScopedPluginsTree() {
  return {
    '/sanity/sanity.json': sanityManifest(['@sanity/core', '@sanity/foo']),
    '/sanity/node_modules': {
      '@sanity': sanityCore(),
    },
  }
}

export function getDeepTree({missingPlugin, missingManifest} = {}) {
  const plugins = ['@sanity/core', 'foo']
  if (missingPlugin) {
    plugins.push('missing')
  }

  const baz = {
    'sanity-plugin-baz': missingManifest
      ? {}
      : {
          'sanity.json': pluginManifest({
            parts: [],
          }),
        },
  }

  return merge(getBasicTree(), {
    '/sanity/sanity.json': sanityManifest(plugins),
    '/sanity/node_modules': merge(
      {
        'sanity-plugin-foo': {
          'sanity.json': pluginManifest({
            plugins: ['bar'],
            parts: [
              {
                implements: 'part:bar/baz',
                path: 'someFile',
              },
            ],
          }),
        },
        'sanity-plugin-bar': {
          'sanity.json': pluginManifest({
            plugins: ['baz'],
            parts: [
              {
                name: 'part:bar/baz',
                description: 'The baz of the bar',
              },
            ],
          }),
        },
      },
      baz
    ),
  })
}

export function getInvalidJson({atRoot}) {
  return {
    '/sanity/sanity.json': atRoot ? '{foo:bar' : sanityManifest(['instagram']),
    '/sanity/node_modules/sanity-plugin-instagram/sanity.json': '{"invalid"',
  }
}

export function getInvalidManifest({atRoot}) {
  return {
    '/sanity/sanity.json': atRoot ? '{"plugins":"foo"}' : sanityManifest('instagram'),
    '/sanity/node_modules/sanity-plugin-instagram/sanity.json': pluginManifest({
      parts: [
        {
          name: 'path',
        },
      ],
    }),
  }
}

export function getInvalidPartDeclaration(opts) {
  return {
    '/sanity/sanity.json': sanityManifest(['foo']),
    '/sanity/plugins/foo/sanity.json': pluginManifest({
      parts: [
        opts.missingDescription
          ? {name: 'part:foo/thing'}
          : {name: 'part:foo/thing', description: 'Thing'},

        opts.unprefixed
          ? {name: 'foo/bar', description: 'Bar'}
          : {name: 'part:foo/bar', description: 'Bar'},

        opts.allPrefixed
          ? {name: 'all:part:foo/baz', description: 'Baz'}
          : {name: 'part:foo/baz', description: 'Baz'},

        opts.doublePrefix
          ? {name: 'part:foo/baz:foo', description: 'Baz'}
          : {name: 'part:foo/baz', description: 'Baz'},

        opts.noPluginName
          ? {name: 'part:foo-bar', description: 'Baz'}
          : {name: 'part:foo/baz', description: 'Baz'},

        opts.noPartName
          ? {name: 'part:foo/', description: 'Baz'}
          : {name: 'part:foo/bar', description: 'Baz'},

        opts.missingImplements
          ? {path: 'file.js'}
          : {path: 'file.js', implements: 'part:foo/thing'},

        opts.missingName ? {path: 'file.js'} : {path: 'file.js', name: 'part:foo/thingie'},

        opts.missingPath
          ? {implements: 'part:foo/bar'}
          : {path: 'bar.js', implements: 'part:foo/bar'},
      ],
    }),
  }
}

export function getStyleTree() {
  return {
    '/sanity/sanity.json': sanityManifest([
      '@sanity/default-layout',
      'material-design',
      'screaming-dev-badge',
    ]),
    '/sanity/node_modules': {
      'sanity-plugin-material-design': {
        'sanity.json': pluginManifest({
          parts: [
            {
              implements: 'part:@sanity/default-layout/header-style',
              path: 'css/header.css',
            },
          ],
        }),
      },
      '@sanity': {
        'default-layout': {
          'sanity.json': pluginManifest({
            parts: [
              {
                name: 'part:@sanity/default-layout/header-style',
                description: 'Styling for the header',
              },
              {
                implements: 'part:@sanity/default-layout/header-style',
                path: 'css/header.css',
              },
            ],
          }),
        },
      },
      'sanity-plugin-screaming-dev-badge': {
        'sanity.json': pluginManifest({
          parts: [
            {
              implements: 'part:@sanity/default-layout/header-style',
              path: 'css/scream.css',
            },
          ],
        }),
      },
    },
  }
}

export function getMultiTree() {
  return {
    '/sanity/sanity.json': sanityManifest(['@sanity/base', 'absolute-thing', 'another-thing']),
    '/sanity/node_modules/@sanity': {
      base: {
        'sanity.json': pluginManifest({
          parts: [
            {
              name: 'part:@sanity/base/root',
              description: 'Root component...',
            },
            {
              name: 'part:@sanity/base/absolute',
              description: 'UI elements that position themselves statically',
            },
          ],
        }),
      },
    },
    '/sanity/plugins': {
      'sanity-plugin-absolute-thing': {
        'sanity.json': pluginManifest({
          parts: [
            {
              implements: 'part:@sanity/base/absolute',
              path: 'DevBadge.js',
            },
          ],
        }),
      },
      'another-thing': {
        'sanity.json': pluginManifest({
          parts: [
            {
              implements: 'part:@sanity/base/absolute',
              path: 'foo/bar.js',
            },
          ],
        }),
      },
    },
  }
}

export function getStyleOverriderTree() {
  return {
    '/sanity/sanity.json': sanityManifest(['foo', 'bar']),
    '/sanity/plugins': {
      foo: {
        'sanity.json': pluginManifest({
          parts: [
            {
              name: 'part:foo/button-style',
              description: 'Styles for the foo button',
            },
            {
              name: 'part:foo/button-default-style',
              implements: 'part:foo/button-style',
              path: 'components/Button.css',
            },
          ],
        }),
      },
      bar: {
        'sanity.json': pluginManifest({
          parts: [
            {
              implements: 'part:foo/button-style',
              path: 'bar/button.css',
            },
          ],
        }),
      },
    },
  }
}

export function getStyleVarTree() {
  return {
    '/sanity/sanity.json': sanityManifest(['@sanity/base', 'some-overrider']),
    '/sanity/node_modules/@sanity': {
      base: {
        'sanity.json': pluginManifest({
          parts: [
            {
              name: 'part:@sanity/base/root',
              description: 'Root component of the system',
            },
            {
              name: 'style-variables',
              description: 'All style variables available in CSS-context',
            },
            {
              name: 'style-variables',
              path: 'styleVariables.js',
            },
          ],
        }),
      },
    },
    '/sanity/plugins': {
      'some-overrider': {
        'sanity.json': pluginManifest({
          parts: [
            {
              name: 'style-variables',
              path: 'css/vars.js',
            },
          ],
        }),
      },
      'another-thing': {
        'sanity.json': pluginManifest({
          parts: [
            {
              part: 'part:@sanity/base/root',
              path: 'foo/bar.js',
            },
          ],
        }),
      },
    },
  }
}

export function getNonAbstractPartTree() {
  return {
    '/sanity/sanity.json': sanityManifest(['base', 'overrider']),
    '/sanity/plugins': {
      base: {
        'sanity.json': pluginManifest({
          parts: [
            {
              // Abstract
              name: 'part:base/thing',
              description: 'Root component of the system',
            },
            {
              // Non-abstract
              name: 'part:base/specific',
              description: 'Specific thingyjane',
              path: 'base/specific.js',
            },
          ],
        }),
      },
      overrider: {
        'sanity.json': pluginManifest({
          parts: [
            {
              implements: 'part:base/thing',
              path: 'thing.js',
            },
            {
              implements: 'part:base/specific',
              path: 'specific',
            },
          ],
        }),
      },
    },
  }
}

export function getRootLevelPartsTree() {
  return Object.assign({}, getBasicTree(), {
    '/sanity/sanity.json': sanityManifest(
      ['@sanity/core', 'instagram'],
      [
        {
          name: 'part:@sanity/config/schema',
          path: 'schema/schema.js',
        },
        {
          implements: 'part:@sanity/core/root',
          path: 'myRootComponent.js',
        },
      ]
    ),
  })
}

export function getParentDirTree() {
  return {
    '/sanity/app/sanity.json': sanityManifest(['@sanity/core', 'instagram', '../my-parent-plugin']),
    '/sanity/app/node_modules': {
      'sanity-plugin-instagram': {
        'sanity.json': instagramManifest(),
      },
      '@sanity': sanityCore(),
    },
    '/sanity/my-parent-plugin/package.json': JSON.stringify({
      name: 'my-parent-plugin',
      version: '1.0.0',
    }),
    '/sanity/my-parent-plugin/sanity.json': pluginManifest({
      parts: [
        {
          name: 'part:my-parent-plugin/foo/bar',
          path: 'foobar.js',
        },
      ],
    }),
  }
}

export function getNodeResolutionTree() {
  return Object.assign({}, getBasicTree(), {
    '/sanity/app/sanity.json': sanityManifest([
      '@sanity/core',
      '@sanity/strawberry',
      'rebeltastic',
    ]),
    '/node_modules': {
      '@sanity': {
        strawberry: {
          'sanity.json': sanityManifest(),
        },
      },
      'sanity-plugin-rebeltastic': {
        'sanity.json': sanityManifest(),
      },
    },
  })
}
