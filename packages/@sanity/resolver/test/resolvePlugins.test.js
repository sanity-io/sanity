import path from 'path'
import assert from 'assert'
import mockFs from 'mock-fs'
import resolvePlugins, {resolveRoles, resolveProjectRoot} from '../src/resolver'
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
  getInvalidRoleDeclaration,
  getStyleOverriderTree,
  getNonAbstractRoleTree,
  getRootLevelRolesTree,
  getNodeResolutionTree,
  getPathAlternatives,
  getDuplicatePluginTree
} from './fixtures'

const opts = {basePath: '/sanity'}
const syncOpts = Object.assign({}, opts, {sync: true})

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
    return resolvePlugins(opts).should.be.rejectedWith(Error, /must be an array/)
  })

  it('rejects on invalid non-root-level manifest', () => {
    mockFs(getInvalidManifest({atRoot: false}))
    return resolvePlugins(opts).should.be.rejectedWith(Error, /must be an array/)
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
    return resolveRoles(opts).should.be.rejectedWith(Error, 'both define role "component:snarkel/foo"')
  })

  it('resolves plugins in the right order', () => {
    mockFs(getDeepTree())
    return resolvePlugins(opts).then(plugins => {
      plugins.map(plugin => plugin.name).should.eql([
        '@sanity/default-layout',
        '@sanity/core',
        'baz',
        'bar',
        'foo',
        '(project root)'
      ])
    })
  })

  it('does not list duplicate plugins multiple times', () => {
    mockFs(getDuplicatePluginTree())
    return resolvePlugins(opts).then(plugins => {
      plugins.should.have.length(3)
    })
  })

  it('allows resolving plugins synchronously', () => {
    mockFs(getDeepTree())
    const plugins = resolvePlugins(syncOpts)
    plugins.map(plugin => plugin.name).should.eql([
      '@sanity/default-layout',
      '@sanity/core',
      'baz',
      'bar',
      'foo',
      '(project root)'
    ])
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

    it('follows the node resolution algorithm (trickles down directory tree)', () => {
      mockFs(getNodeResolutionTree())
      const resolveOpts = Object.assign(opts, {basePath: '/sanity/app'})
      return resolvePlugins(resolveOpts).then(plugins => {
        plugins[0].path.should.equal('/sanity/node_modules/@sanity/default-layout')
        plugins[1].path.should.equal('/sanity/node_modules/@sanity/core')
        plugins[2].path.should.equal('/node_modules/@sanity/strawberry')
        plugins[3].path.should.equal('/node_modules/sanity-plugin-rebeltastic')
        plugins[4].path.should.equal('/sanity/app')
      })
    })
  })

  it('can resolve roles for a basic setup', () => {
    mockFs(getBasicTree())
    return resolveRoles(opts).then(res => {
      const settings = res.definitions['component:@sanity/default-layout/settingsPane']
      settings.path.should.equal('/sanity/node_modules/@sanity/default-layout')

      const tool = res.implementations['component:@sanity/default-layout/tool']
      tool.should.have.length(2)
      tool[0].should.eql({
        plugin: 'instagram',
        path: '/sanity/node_modules/sanity-plugin-instagram/lib/components/InstagramTool'
      })

      const main = res.implementations['component:@sanity/core/root']
      main.should.have.length(1)
      main[0].should.eql({
        plugin: '@sanity/default-layout',
        path: '/sanity/node_modules/@sanity/default-layout/lib/components/Root'
      })

      const comments = res.implementations['component:instagram/commentsList']
      comments[0].should.eql({
        plugin: 'instagram',
        path: '/sanity/node_modules/sanity-plugin-instagram/lib/components/CommentsList'
      })
    })
  })

  it('resolves plugins as well as roles', () => {
    mockFs(getBasicTree())
    return resolveRoles(opts).then(res => {
      res.plugins.should.have.length(4)
      res.plugins.map(plugin => plugin.path).should.eql([
        '/sanity/node_modules/@sanity/default-layout',
        '/sanity/node_modules/@sanity/core',
        '/sanity/node_modules/sanity-plugin-instagram',
        '/sanity'
      ])
    })
  })

  it('can resolve roles synchronously', () => {
    mockFs(getBasicTree())

    const res = resolveRoles(syncOpts)
    res.plugins.should.have.length(4)
    res.plugins.map(plugin => plugin.path).should.eql([
      '/sanity/node_modules/@sanity/default-layout',
      '/sanity/node_modules/@sanity/core',
      '/sanity/node_modules/sanity-plugin-instagram',
      '/sanity'
    ])
  })

  it('doesnt try to look up the same location twice', () => {
    mockFs(getScopedPluginsTree())
    return resolveRoles(opts).catch(err => {
      err.locations.some((location, index) =>
        err.locations.indexOf(location, index + 1) !== -1
      ).should.equal(false)
    })
  })

  it('resolves path to "compiled" path for node_modules, "source" for plugins', () => {
    mockFs(getMixedPluginTree())
    return resolveRoles(opts).then(res => {
      res.implementations['component:@sanity/default-layout/tool'][0].should.eql({
        plugin: 'foo',
        path: '/sanity/plugins/foo/src/File'
      })

      res.implementations['component:@sanity/default-layout/tool'][1].should.eql({
        plugin: 'instagram',
        path: '/sanity/node_modules/sanity-plugin-instagram/lib/components/InstagramTool'
      })
    })
  })

  it('resolves path to "compiled" if "useCompiledPaths"-option is set to true', () => {
    mockFs(getMixedPluginTree())
    return resolveRoles(Object.assign({}, opts, {useCompiledPaths: true})).then(res => {
      res.implementations['component:@sanity/default-layout/tool'][0].should.eql({
        plugin: 'foo',
        path: '/sanity/plugins/foo/lib/File'
      })

      res.implementations['component:@sanity/default-layout/tool'][1].should.eql({
        plugin: 'instagram',
        path: '/sanity/node_modules/sanity-plugin-instagram/lib/components/InstagramTool'
      })
    })
  })

  it('treats dot-paths as relative to sanity.json, absolute as absolute', () => {
    mockFs(getPathAlternatives())
    return resolveRoles(opts).then(res => {
      res.implementations['component:foo/relative'][0].should.eql({
        plugin: 'foo',
        path: '/sanity/plugins/foo/src/relative/Path.js'
      })

      res.implementations['component:foo/absolute'][0].should.eql({
        plugin: 'foo',
        path: '/absolute/path/to/File.js'
      })

      res.implementations['component:foo/dot-path'][0].should.eql({
        plugin: 'foo',
        path: '/sanity/plugins/foo/locale/en-us.json'
      })
    })
  })

  it('late-defined plugins assign themselves to the start of the fulfillers list', () => {
    mockFs(getMixedPluginTree())
    return resolveRoles(opts).then(res => {
      const fulfillers = res.implementations['component:instagram/commentsList']
      fulfillers.should.have.length(2)
      fulfillers[0].should.eql({
        plugin: 'foo',
        path: '/sanity/plugins/foo/src/InstaComments'
      })
    })
  })

  it('resolves multi-fulfiller roles correctly', () => {
    mockFs(getMultiTree())
    return resolveRoles(opts).then(res => {
      res.definitions.should.have.property('component:@sanity/base/absolute')
      res.implementations.should.have.property('component:@sanity/base/absolute')
      res.implementations['component:@sanity/base/absolute'].should.have.length(2)
    })
  })

  it('handles style roles as regular roles', () => {
    mockFs(getStyleTree())
    return resolveRoles(opts).then(res => {
      res.implementations['style:@sanity/default-layout/header'].should.eql([
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

  it('allows a role to both implement a role and define a new one', () => {
    mockFs(getStyleOverriderTree())
    return resolveRoles(opts).then(res => {
      res.definitions.should.have.property('style:foo/button')
      res.definitions.should.have.property('style:foo/button-default')

      res.implementations.should.have.property('style:foo/button')
      res.implementations.should.have.property('style:foo/button-default')
    })
  })

  it('does not allow a non-abstract role to be implemented by others', () => {
    mockFs(getNonAbstractRoleTree())
    return resolveRoles(opts).should.be.rejectedWith(Error, 'both define role')
  })

  it('should include roles defined in base manifest', () => {
    mockFs(getRootLevelRolesTree())
    return resolveRoles(opts).then(res => {
      res.definitions.should.have.property('config:@sanity/config/schema')
      res.definitions['config:@sanity/config/schema'].path.should.eql('/sanity')

      res.implementations.should.have.property('config:@sanity/config/schema')
      res.implementations['config:@sanity/config/schema'][0].path.should.eql(
        path.join('/sanity', 'schema', 'schema.js')
      )

      const last = res.plugins[res.plugins.length - 1]
      last.name.should.eql('(project root)')
      last.path.should.eql('/sanity')
    })
  })

  it('should treat base manifest roles as most significant', () => {
    mockFs(getRootLevelRolesTree({}))
    return resolveRoles(opts).then(res => {
      res.definitions.should.have.property('component:@sanity/core/root')
      res.definitions['component:@sanity/core/root'].plugin.should.eql('@sanity/core')

      res.implementations.should.have.property('component:@sanity/core/root')
      res.implementations['component:@sanity/core/root'][0].path.should.eql('/sanity/myRootComponent.js')
    })
  })

  it('should be able to find project root synchronously by looking for `root` prop', () => {
    mockFs(getResolutionOrderFixture({chosenMethod: 'subNodeModules'}))

    const rootPath = resolveProjectRoot({
      basePath: '/sanity/node_modules/sanity-plugin-foo/node_modules/sanity-plugin-bar',
      sync: true
    })

    rootPath.should.eql('/sanity')
  })

  it('should resolve project root if option is passed', () => {
    mockFs(getResolutionOrderFixture({chosenMethod: 'subNodeModules'}))

    return resolveRoles({
      basePath: '/sanity/node_modules/sanity-plugin-foo/node_modules/sanity-plugin-bar',
      resolveProjectRoot: true
    }).then(roles => {
      roles.plugins[roles.plugins.length - 1].path.should.eql('/sanity')
    })
  })
})

function shouldHaveThrown() {
  assert.fail('Result', 'Error', 'Test should have fail, instead succeeded', '!=')
}
