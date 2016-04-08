import assert from 'assert'
import mockFs from 'mock-fs'
import resolvePlugins, {resolveRoles} from '../src/resolver'
import {afterEach, describe, it} from 'mocha'
import {
  getBasicTree,
  getDeepTree,
  getInvalidJson,
  getInvalidManifest,
  getMixedPluginTree,
  getResolutionOrderFixture,
  getScopedPluginsTree,
  getStyleTree,
  getMultiTree,
  getDuplicateRoleTree,
  getInvalidRoleDeclaration
} from './fixtures'

const opts = {basePath: '/sanity'}

describe('plugin resolver', () => {
  afterEach(() => {
    mockFs.restore()
  })

  it('rejects on invalid root-level JSON', () => {
    mockFs(getInvalidJson({atRoot: true}))
    return resolvePlugins(opts).should.be.rejectedWith(SyntaxError)
  })

  it('rejects on invalid non-root-level JSON', () => {
    mockFs(getInvalidJson({atRoot: false}))
    return resolvePlugins(opts).should.be.rejectedWith(SyntaxError)
  })

  it('rejects on invalid root-level manifest', () => {
    mockFs(getInvalidManifest({atRoot: true}))
    return resolvePlugins(opts).should.be.rejectedWith(/ValidationError/, /must be an array/)
  })

  it('rejects on invalid non-root-level manifest', () => {
    mockFs(getInvalidManifest({atRoot: false}))
    return resolvePlugins(opts).should.be.rejectedWith(/ValidationError/, /must be an array/)
  })

  describe('rejects on invalid roles declaration', () => {
    it('roles with no path needs a description', () => {
      mockFs(getInvalidRoleDeclaration({missingDescription: true}))
      return resolvePlugins(opts).then(shouldHaveThrown).catch(err => {
        err.message.should.contain('index 0')
        err.message.should.contain('`description`')
      })
    })

    it('role names need a prefix', () => {
      mockFs(getInvalidRoleDeclaration({unprefixed: true}))
      return resolvePlugins(opts).then(shouldHaveThrown).catch(err => {
        err.message.should.contain('index 1')
        err.message.should.contain('needs a prefix')
        err.message.should.contain('xamples')
      })
    })

    it('role names should not include reserved keywords', () => {
      mockFs(getInvalidRoleDeclaration({allPrefixed: true}))
      return resolvePlugins(opts).then(shouldHaveThrown).catch(err => {
        err.message.should.contain('index 2')
        err.message.should.contain('"all:"')
        err.message.should.contain('xamples')
      })
    })

    it('role names should not have more than one prefix', () => {
      mockFs(getInvalidRoleDeclaration({doublePrefix: true}))
      return resolvePlugins(opts).then(shouldHaveThrown).catch(err => {
        err.message.should.contain('index 3')
        err.message.should.contain('":"')
        err.message.should.contain('xamples')
      })
    })

    it('role names should include plugin name', () => {
      mockFs(getInvalidRoleDeclaration({noPluginName: true}))
      return resolvePlugins(opts).then(shouldHaveThrown).catch(err => {
        err.message.should.contain('index 4')
        err.message.should.contain('plugin name')
        err.message.should.contain('xamples')
      })
    })

    it('role names should include role name after plugin name', () => {
      mockFs(getInvalidRoleDeclaration({noRoleName: true}))
      return resolvePlugins(opts).then(shouldHaveThrown).catch(err => {
        err.message.should.contain('index 5')
        err.message.should.contain('after the plugin name')
        err.message.should.contain('xamples')
      })
    })

    it('roles with `path` should contain `implements` or `name`', () => {
      mockFs(getInvalidRoleDeclaration({missingImplements: true}))
      return resolvePlugins(opts).then(shouldHaveThrown).catch(err => {
        err.message.should.contain('index 6')
        err.message.should.contain('either `name` or `implements`')
      })
    })

    it('roles with `path` should contain `implements` or `name`', () => {
      mockFs(getInvalidRoleDeclaration({missingName: true}))
      return resolvePlugins(opts).then(shouldHaveThrown).catch(err => {
        err.message.should.contain('index 7')
        err.message.should.contain('either `name` or `implements`')
      })
    })

    it('roles with `implements` should contain `path`', () => {
      mockFs(getInvalidRoleDeclaration({missingPath: true}))
      return resolvePlugins(opts).then(shouldHaveThrown).catch(err => {
        err.message.should.contain('index 8')
      })
    })

    it('roles with `srcPath` should also contain `path`', () => {
      mockFs(getInvalidRoleDeclaration({missingLibPath: true}))
      return resolvePlugins(opts).then(shouldHaveThrown).catch(err => {
        err.message.should.contain('index 9')
        err.message.should.contain('`srcPath`')
        err.message.should.contain('compiled')
      })
    })
  })

  it('rejects on missing plugin', () => {
    mockFs(getDeepTree({missingPlugin: true}))
    return resolvePlugins(opts).should.be.rejectedWith(Error, /"missing"/)
  })

  it('rejects on missing plugin manifest', () => {
    mockFs(getDeepTree({missingManifest: true}))
    return resolvePlugins(opts).should.be.rejectedWith(Error, /"sanity\.json"/)
  })

  it('rejects if two plugins define the same role', () => {
    mockFs(getDuplicateRoleTree())
    return resolveRoles({basePath: '/sanity'}).should.be.rejectedWith(Error, 'both provide "component:snarkel/foo"')
  })

  it('resolves plugins in the right order', () => {
    mockFs(getDeepTree())
    return resolvePlugins(opts).then(plugins => {
      plugins.map(plugin => plugin.name).should.eql([
        '@sanity/default-layout',
        '@sanity/core',
        'baz',
        'bar',
        'foo'
      ])
    })
  })

  describe('respects the sanity plugin resolution order', () => {
    it('prefers fully qualified, local path (/plugins/sanity-plugin-<name>)', () => {
      mockFs(getResolutionOrderFixture({chosenMethod: 'fullLocalPath'}))
      return resolvePlugins(opts).then(plugins => {
        plugins[0].path.should.equal('/sanity/plugins/sanity-plugin-bar')
      })
    })

    it('prefers short-named, local path as 2nd option (/plugins/<name>)', () => {
      mockFs(getResolutionOrderFixture({chosenMethod: 'shortLocalPath'}))
      return resolvePlugins(opts).then(plugins => {
        plugins[0].path.should.equal('/sanity/plugins/bar')
      })
    })

    const subPath = '/node_modules/sanity-plugin-<parent>/node_modules/sanity-plugin-<name>'
    it(`prefers fully qualified in parent plugin node_modules as 3rd option (${subPath})`, () => {
      mockFs(getResolutionOrderFixture({chosenMethod: 'subNodeModules'}))
      return resolvePlugins(opts).then(plugins => {
        plugins[0].path.should.equal('/sanity/node_modules/sanity-plugin-foo/node_modules/sanity-plugin-bar')
      })
    })

    it('prefers fully qualified in root node_modules as 4th option (/node_modules/sanity-plugin-<name>)', () => {
      mockFs(getResolutionOrderFixture({chosenMethod: 'nodeModules'}))
      return resolvePlugins(opts).then(plugins => {
        plugins[0].path.should.equal('/sanity/node_modules/sanity-plugin-bar')
      })
    })
  })

  it('can resolve roles for a basic setup', () => {
    mockFs(getBasicTree())
    return resolveRoles({basePath: '/sanity'}).then(res => {
      const settings = res.definitions['component:@sanity/default-layout/settingsPane']
      settings.path.should.equal('/sanity/node_modules/@sanity/default-layout')

      const tool = res.fulfilled['component:@sanity/default-layout/tool']
      tool.should.have.length(2)
      tool[0].should.eql({
        plugin: 'instagram',
        path: '/sanity/node_modules/sanity-plugin-instagram/lib/components/InstagramTool'
      })

      const main = res.fulfilled['component:@sanity/core/root']
      main.should.have.length(1)
      main[0].should.eql({
        plugin: '@sanity/default-layout',
        path: '/sanity/node_modules/@sanity/default-layout/src/components/Root'
      })

      const comments = res.fulfilled['component:instagram/commentsList']
      comments[0].should.eql({
        plugin: 'instagram',
        path: '/sanity/node_modules/sanity-plugin-instagram/lib/components/CommentsList'
      })
    })
  })

  it('resolves plugins as well as roles', () => {
    mockFs(getBasicTree())
    return resolveRoles({basePath: '/sanity'}).then(res => {
      res.plugins.should.have.length(3)
      res.plugins.map(plugin => plugin.path).should.eql([
        '/sanity/node_modules/@sanity/default-layout',
        '/sanity/node_modules/@sanity/core',
        '/sanity/node_modules/sanity-plugin-instagram'
      ])
    })
  })

  it('doesnt try to look up the same location twice', () => {
    mockFs(getScopedPluginsTree())
    return resolveRoles({basePath: '/sanity'}).catch(err => {
      err.locations.some((location, index) =>
        err.locations.indexOf(location, index + 1) !== -1
      ).should.equal(false)
    })
  })

  it('resolves path to lib for node_modules, src for plugins', () => {
    mockFs(getMixedPluginTree())
    return resolveRoles({basePath: '/sanity'}).then(res => {
      res.fulfilled['component:@sanity/default-layout/tool'][0].should.eql({
        plugin: 'foo',
        path: '/sanity/plugins/foo/src/File'
      })

      res.fulfilled['component:@sanity/default-layout/tool'][1].should.eql({
        plugin: 'instagram',
        path: '/sanity/node_modules/sanity-plugin-instagram/lib/components/InstagramTool'
      })
    })
  })

  it('late-defined plugins assign themselves to the start of the fulfillers list', () => {
    mockFs(getMixedPluginTree())
    return resolveRoles({basePath: '/sanity'}).then(res => {
      const fulfillers = res.fulfilled['component:instagram/commentsList']
      fulfillers.should.have.length(2)
      fulfillers[0].should.eql({
        plugin: 'foo',
        path: '/sanity/plugins/foo/src/InstaComments'
      })
    })
  })

  it('resolves multi-fulfiller roles correctly', () => {
    mockFs(getMultiTree())
    return resolveRoles({basePath: '/sanity'}).then(res => {
      res.definitions.should.have.property('component:@sanity/base/absolute')
      res.fulfilled.should.have.property('component:@sanity/base/absolute')
      res.fulfilled['component:@sanity/base/absolute'].should.have.length(2)
    })
  })

  it('handles style roles as regular roles', () => {
    mockFs(getStyleTree())
    return resolveRoles({basePath: '/sanity'}).then(res => {
      res.fulfilled['style:@sanity/default-layout/header'].should.eql([
        {
          path: '/sanity/node_modules/sanity-plugin-screaming-dev-badge/css/scream.css',
          plugin: 'screaming-dev-badge'
        },
        {
          path: '/sanity/node_modules/sanity-plugin-material-design/css/header.css',
          plugin: 'material-design'
        },
        {
          path: '/sanity/node_modules/@sanity/default-layout/css/header.css',
          plugin: '@sanity/default-layout'
        }
      ])
    })
  })
})

function shouldHaveThrown() {
  assert.fail('Result', 'Error', 'Test should have fail, instead succeeded', '!=')
}
