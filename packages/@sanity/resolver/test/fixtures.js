import merge from 'lodash/merge'

function sanityManifest(plugins, roles, opts = {}) {
  return JSON.stringify({
    root: opts.root,
    server: {
      port: 7777
    },
    plugins: plugins || [],
    roles: roles
  }, null, 2)
}

function pluginManifest(props) {
  return JSON.stringify(props, null, 2)
}

function instagramManifest() {
  return pluginManifest({
    paths: {
      source: 'src',
      compiled: 'lib'
    },

    roles: [{
      name: 'component:instagram/commentsList',
      description: 'List of comments...'
    }, {
      name: 'component:instagram/comment',
      description: 'A comment on instagram'
    }, {
      implements: 'component:instagram/commentsList',
      path: 'components/CommentsList'
    }, {
      implements: 'component:instagram/comment',
      path: 'components/Comment'
    }, {
      name: 'component:instagram/instagramTool',
      implements: 'component:@sanity/default-layout/tool',
      path: 'components/InstagramTool'
    }, {
      name: 'component:instagram/instagramDiscoverTool',
      implements: 'component:@sanity/default-layout/tool',
      path: 'components/InstaDiscoverTool'
    }]
  })
}

function defaultLayout() {
  return {
    'sanity.json': pluginManifest({
      paths: {
        source: 'src',
        compiled: 'lib'
      },

      roles: [{
        name: 'component:@sanity/default-layout/tool',
        description: 'A generic UI tool'
      }, {
        name: 'component:@sanity/default-layout/settingsPane',
        description: 'One "tab" of the default layout settings'
      }, {
        implements: 'component:@sanity/core/root',
        path: 'components/Root'
      }]
    })
  }
}

function sanityCore() {
  return {
    'core': {
      'sanity.json': pluginManifest({
        plugins: [
          '@sanity/default-layout'
        ],
        roles: [{
          name: 'component:@sanity/core/root',
          description: 'The main component in the UI hierarchy. Usually a layout.'
        }]
      })
    },
    'default-layout': defaultLayout()
  }
}

export function getResolutionOrderFixture({chosenMethod}) {
  const order = ['fullLocalPath', 'shortLocalPath', 'subNodeModules', 'nodeModules']
  const paths = {
    fullLocalPath: '/sanity/plugins/sanity-plugin-bar/sanity.json',
    shortLocalPath: '/sanity/plugins/bar/sanity.json',
    subNodeModules: '/sanity/node_modules/sanity-plugin-foo/node_modules/sanity-plugin-bar/sanity.json',
    nodeModules: '/sanity/node_modules/sanity-plugin-bar/sanity.json'
  }

  const base = {
    '/sanity/sanity.json': sanityManifest(['foo'], [], {root: true}),
    '/sanity/node_modules/sanity-plugin-foo/sanity.json': pluginManifest({plugins: ['bar']})
  }

  const extendWith = {}
  const startIndex = order.indexOf(chosenMethod)
  for (let i = startIndex; i < order.length; i++) {
    const method = order[i]
    extendWith[paths[method]] = pluginManifest({})
  }

  return Object.assign({}, base, extendWith)
}

export function getDuplicateRoleTree() {
  return {
    '/sanity/sanity.json': sanityManifest(['snarkel', 'snuffel']),
    '/sanity/plugins': {
      snarkel: {
        'sanity.json': pluginManifest({
          roles: [{
            name: 'component:snarkel/foo',
            description: 'Foo'
          }]
        })
      },
      snuffel: {
        'sanity.json': pluginManifest({
          roles: [{
            name: 'component:snarkel/foo',
            description: 'Dupe'
          }]
        })
      }
    }
  }
}

export function getDuplicatePluginTree() {
  return {
    '/sanity/sanity.json': sanityManifest(['form-builder', 'google-maps-input']),
    '/sanity/plugins': {
      'form-builder': {
        'sanity.json': pluginManifest({
          plugins: ['google-maps-input'],
          roles: [{
            name: 'component:form-builder/thing',
            description: 'Yup'
          }]
        })
      },
      'google-maps-input': {
        'sanity.json': pluginManifest({
          roles: [{
            name: 'component:google-maps-input/thing',
            description: 'Map thing',
            path: './Thing.js'
          }]
        })
      }
    }
  }
}

export function getBasicTree() {
  return {
    '/sanity/sanity.json': sanityManifest(['@sanity/core', 'instagram']),
    '/sanity/node_modules': {
      'sanity-plugin-instagram': {
        'sanity.json': instagramManifest(),
      },
      '@sanity': sanityCore()
    }
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
            source: './src'
          },

          roles: [{
            implements: 'component:@sanity/default-layout/tool',
            path: 'File'
          }, {
            implements: 'component:instagram/commentsList',
            path: 'InstaComments'
          }]
        })
      }
    }
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
            source: './src'
          },

          roles: [{
            implements: 'component:foo/relative',
            path: 'relative/Path.js'
          }, {
            implements: 'component:foo/absolute',
            path: '/absolute/path/to/File.js'
          }, {
            implements: 'component:foo/dot-path',
            path: './locale/en-us.json'
          }]
        })
      }
    }
  }
}

export function getScopedPluginsTree() {
  return {
    '/sanity/sanity.json': sanityManifest(['@sanity/core', '@sanity/foo']),
    '/sanity/node_modules': {
      '@sanity': sanityCore()
    }
  }
}

export function getDeepTree({missingPlugin, missingManifest} = {}) {
  const plugins = ['@sanity/core', 'foo']
  if (missingPlugin) {
    plugins.push('missing')
  }

  return merge(getBasicTree(), {
    '/sanity/sanity.json': sanityManifest(plugins),
    '/sanity/node_modules': {
      'sanity-plugin-foo': {
        'sanity.json': pluginManifest({
          plugins: ['bar'],
          roles: [{
            implements: 'component:bar/baz',
            path: 'someFile'
          }]
        })
      },
      'sanity-plugin-bar': {
        'sanity.json': pluginManifest({
          plugins: ['baz'],
          roles: [{
            name: 'component:bar/baz',
            description: 'The baz of the bar'
          }]
        })
      },
      'sanity-plugin-baz': !missingManifest && {
        'sanity.json': pluginManifest({
          roles: []
        })
      }
    }
  })
}

export function getInvalidJson({atRoot}) {
  return {
    '/sanity/sanity.json': atRoot ? '{foo:bar' : sanityManifest(['instagram']),
    '/sanity/node_modules/sanity-plugin-instagram/sanity.json': '{"invalid"'
  }
}

export function getInvalidManifest({atRoot}) {
  return {
    '/sanity/sanity.json': atRoot ? '{"plugins":"foo"}' : sanityManifest('instagram'),
    '/sanity/node_modules/sanity-plugin-instagram/sanity.json': pluginManifest({
      roles: [{
        name: 'path'
      }]
    })
  }
}

export function getInvalidRoleDeclaration(opts) {
  return {
    '/sanity/sanity.json': sanityManifest(['foo']),
    '/sanity/plugins/foo/sanity.json': pluginManifest({
      roles: [
        opts.missingDescription
          ? {name: 'component:foo/thing'}
          : {name: 'component:foo/thing', description: 'Thing'},

        opts.unprefixed
          ? {name: 'foo/bar', description: 'Bar'}
          : {name: 'component:foo/bar', description: 'Bar'},

        opts.allPrefixed
          ? {name: 'all:component:foo/baz', description: 'Baz'}
          : {name: 'component:foo/baz', description: 'Baz'},

        opts.doublePrefix
          ? {name: 'component:foo/baz:foo', description: 'Baz'}
          : {name: 'component:foo/baz', description: 'Baz'},

        opts.noPluginName
          ? {name: 'component:foo-bar', description: 'Baz'}
          : {name: 'component:foo/baz', description: 'Baz'},

        opts.noRoleName
          ? {name: 'component:foo/', description: 'Baz'}
          : {name: 'component:foo/bar', description: 'Baz'},

        opts.missingImplements
          ? {path: 'file.js'}
          : {path: 'file.js', implements: 'component:foo/thing'},

        opts.missingName
          ? {path: 'file.js'}
          : {path: 'file.js', name: 'component:foo/thingie'},

        opts.missingPath
          ? {implements: 'component:foo/bar'}
          : {path: 'bar.js', implements: 'component:foo/bar'}
      ]
    })
  }
}

export function getStyleTree() {
  return {
    '/sanity/sanity.json': sanityManifest([
      '@sanity/default-layout',
      'material-design',
      'screaming-dev-badge'
    ]),
    '/sanity/node_modules': {
      'sanity-plugin-material-design': {
        'sanity.json': pluginManifest({
          roles: [{
            implements: 'style:@sanity/default-layout/header',
            path: 'css/header.css'
          }]
        }),
      },
      '@sanity': {
        'default-layout': {
          'sanity.json': pluginManifest({
            roles: [{
              name: 'style:@sanity/default-layout/header',
              description: 'Styling for the header'
            }, {
              implements: 'style:@sanity/default-layout/header',
              path: 'css/header.css'
            }]
          })
        }
      },
      'sanity-plugin-screaming-dev-badge': {
        'sanity.json': pluginManifest({
          roles: [{
            implements: 'style:@sanity/default-layout/header',
            path: 'css/scream.css'
          }]
        })
      }
    }
  }
}

export function getMultiTree() {
  return {
    '/sanity/sanity.json': sanityManifest(['@sanity/base', 'absolute-thing', 'another-thing']),
    '/sanity/node_modules/@sanity': {
      base: {
        'sanity.json': pluginManifest({
          roles: [{
            name: 'component:@sanity/base/root',
            description: 'Root component...',
          }, {
            name: 'component:@sanity/base/absolute',
            description: 'UI elements that position themselves statically'
          }]
        })
      }
    },
    '/sanity/plugins': {
      'sanity-plugin-absolute-thing': {
        'sanity.json': pluginManifest({
          roles: [{
            implements: 'component:@sanity/base/absolute',
            path: 'DevBadge.js',

          }]
        })
      },
      'another-thing': {
        'sanity.json': pluginManifest({
          roles: [{
            implements: 'component:@sanity/base/absolute',
            path: 'foo/bar.js'
          }]
        })
      }
    }
  }
}

export function getStyleOverriderTree() {
  return {
    '/sanity/sanity.json': sanityManifest(['foo', 'bar']),
    '/sanity/plugins': {
      foo: {
        'sanity.json': pluginManifest({
          roles: [{
            name: 'style:foo/button',
            description: 'Styles for the foo button'
          }, {
            name: 'style:foo/button-default',
            implements: 'style:foo/button',
            path: 'components/Button.css'
          }]
        })
      },
      bar: {
        'sanity.json': pluginManifest({
          roles: [{
            implements: 'style:foo/button',
            path: 'bar/button.css'
          }]
        })
      }
    }
  }
}

export function getStyleVarTree() {
  return {
    '/sanity/sanity.json': sanityManifest(['@sanity/base', 'some-overrider']),
    '/sanity/node_modules/@sanity': {
      base: {
        'sanity.json': pluginManifest({
          roles: [{
            name: 'component:@sanity/base/root',
            description: 'Root component of the system'
          }, {
            name: 'style-variables',
            description: 'All style variables available in CSS-context'
          }, {
            name: 'style-variables',
            path: 'styleVariables.js'
          }]
        })
      }
    },
    '/sanity/plugins': {
      'some-overrider': {
        'sanity.json': pluginManifest({
          roles: [{
            name: 'style-variables',
            path: 'css/vars.js'
          }]
        })
      },
      'another-thing': {
        'sanity.json': pluginManifest({
          roles: [{
            role: 'component:@sanity/base/root',
            path: 'foo/bar.js'
          }]
        })
      }
    }
  }
}

export function getNonAbstractRoleTree() {
  return {
    '/sanity/sanity.json': sanityManifest(['base', 'overrider']),
    '/sanity/plugins': {
      base: {
        'sanity.json': pluginManifest({
          roles: [{
            // Abstract
            name: 'component:base/thing',
            description: 'Root component of the system'
          }, {
            // Non-abstract
            name: 'component:base/specific',
            description: 'Specific thingyjane',
            path: 'base/specific.js'
          }]
        })
      },
      overrider: {
        'sanity.json': pluginManifest({
          roles: [{
            implements: 'component:base/thing',
            path: 'thing.js'
          }, {
            implements: 'component:base/specific',
            path: 'specific'
          }]
        })
      }
    }
  }
}

export function getRootLevelRolesTree() {
  return Object.assign({}, getBasicTree(), {
    '/sanity/sanity.json': sanityManifest(
      ['@sanity/core', 'instagram'],
      [{
        name: 'config:@sanity/config/schema',
        path: 'schema/schema.js'
      }, {
        implements: 'component:@sanity/core/root',
        path: 'myRootComponent.js'
      }]
    )
  })
}

export function getNodeResolutionTree() {
  return Object.assign({}, getBasicTree(), {
    '/sanity/app/sanity.json': sanityManifest(
      ['@sanity/core', '@sanity/strawberry', 'rebeltastic']
    ),
    '/node_modules': {
      '@sanity': {
        strawberry: {
          'sanity.json': sanityManifest()
        }
      },
      'sanity-plugin-rebeltastic': {
        'sanity.json': sanityManifest()
      }
    }
  })
}
