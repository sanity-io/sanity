import merge from 'lodash/merge'

function sanityManifest(plugins) {
  return JSON.stringify({
    server: {
      port: 7777
    },
    plugins: plugins || []
  }, null, 2)
}

function pluginManifest(props) {
  return JSON.stringify(props, null, 2)
}

function instagramManifest() {
  return pluginManifest({
    roles: [{ // Definitions
      name: 'component:instagram/commentsList',
      description: 'List of comments...'
    }, {
      name: 'component:instagram/comment',
      description: 'A comment on instagram'
    }, { // Implementations
      implements: 'component:instagram/commentsList',
      path: './lib/components/CommentsList',
      srcPath: './src/components/CommentsList'
    }, {
      implements: 'component:instagram/comment',
      path: './lib/components/Comment',
      srcPath: './src/components/Comment'
    }, {
      name: 'component:instagram/instagramTool',
      implements: 'component:@sanity/default-layout/tool',
      path: './lib/components/InstagramTool',
      srcPath: './src/components/InstagramTool'
    }, {
      name: 'component:instagram/instagramDiscoverTool',
      implements: 'component:@sanity/default-layout/tool',
      path: './lib/components/InstaDiscoverTool',
      srcPath: './src/components/InstaDiscoverTool'
    }]
  })
}

function defaultLayout() {
  return {
    'sanity.json': pluginManifest({
      roles: [{
        name: 'component:@sanity/default-layout/tool',
        description: 'A generic UI tool'
      }, {
        name: 'component:@sanity/default-layout/settingsPane',
        description: 'One "tab" of the default layout settings'
      }, {
        implements: 'component:@sanity/core/root',
        path: './src/components/Root'
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
    '/sanity/sanity.json': sanityManifest(['foo']),
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
        'sanity.json': pluginManifest({roles: [{name: 'component:snarkel/foo'}]})
      },
      snuffel: {
        'sanity.json': pluginManifest({roles: [{name: 'component:snarkel/foo'}]})
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
          roles: [{
            implements: 'component:@sanity/default-layout/tool',
            path: './lib/File',
            srcPath: './src/File'
          }, {
            implements: 'component:instagram/commentsList',
            path: './lib/InstaComments',
            srcPath: './src/InstaComments'
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
            path: './someFile'
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
            path: './css/header.css'
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
              path: './css/header.css'
            }]
          })
        }
      },
      'sanity-plugin-screaming-dev-badge': {
        'sanity.json': pluginManifest({
          roles: [{
            implements: 'style:@sanity/default-layout/header',
            path: './css/scream.css'
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
            path: './lib/DevBadge.js',
            srcPath: './src/DevBadge.js'
          }]
        })
      },
      'another-thing': {
        'sanity.json': pluginManifest({
          roles: [{
            implements: 'component:@sanity/base/absolute',
            path: './foo/bar.js'
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
            path: './styleVariables.js'
          }]
        })
      }
    },
    '/sanity/plugins': {
      'some-overrider': {
        'sanity.json': pluginManifest({
          roles: [{
            name: 'style-variables',
            path: './css/vars.js'
          }]
        })
      },
      'another-thing': {
        'sanity.json': pluginManifest({
          roles: [{
            role: 'component:@sanity/base/root',
            path: './foo/bar.js'
          }]
        })
      }
    }
  }
}
