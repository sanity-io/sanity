import path from 'path'
import assert from 'assert'
import mockFs from 'mock-fs'
import resolvePlugins, {resolveParts, resolveProjectRoot} from '../src/resolver'
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
  getParentDirTree,
  getDuplicatePartTree,
  getInvalidPartDeclaration,
  getStyleOverriderTree,
  getNonAbstractPartTree,
  getRootLevelPartsTree,
  getNodeResolutionTree,
  getPathAlternatives,
  getDuplicatePluginTree,
} from './fixtures'

const opts = {basePath: '/sanity'}
const syncOpts = Object.assign({}, opts, {sync: true})

describe('plugin resolver', () => {
  afterEach(() => {
    mockFs.restore()
  })

  it('rejects on invalid root-level JSON', () => {
    mockFs(getInvalidJson({atRoot: true}))
    return expect(resolvePlugins(opts)).rejects.toBeInstanceOf(SyntaxError)
  })

  it('rejects on invalid non-root-level JSON', () => {
    mockFs(getInvalidJson({atRoot: false}))
    return expect(resolvePlugins(opts)).rejects.toBeInstanceOf(SyntaxError)
  })

  it('rejects on invalid root-level manifest', () => {
    mockFs(getInvalidManifest({atRoot: true}))
    return expect(resolvePlugins(opts)).rejects.toMatchObject({message: /must be an array/i})
  })

  it('rejects on invalid non-root-level manifest', () => {
    mockFs(getInvalidManifest({atRoot: false}))
    return expect(resolvePlugins(opts)).rejects.toMatchObject({message: /must be an array/i})
  })

  describe('rejects on invalid parts declaration', () => {
    it('parts with no path needs a description', () => {
      mockFs(getInvalidPartDeclaration({missingDescription: true}))
      return resolvePlugins(opts)
        .then(shouldHaveThrown)
        .catch((err) => {
          expect(err.message).toContain('index 0')
          expect(err.message).toContain('`description`')
        })
    })

    it('part names need a prefix', () => {
      mockFs(getInvalidPartDeclaration({unprefixed: true}))
      return resolvePlugins(opts)
        .then(shouldHaveThrown)
        .catch((err) => {
          expect(err.message).toContain('index 1')
          expect(err.message).toContain('needs a "part:"-prefix')
          expect(err.message).toContain('xamples')
        })
    })

    it('part names should not include reserved keywords', () => {
      mockFs(getInvalidPartDeclaration({allPrefixed: true}))
      return resolvePlugins(opts)
        .then(shouldHaveThrown)
        .catch((err) => {
          expect(err.message).toContain('index 2')
          expect(err.message).toContain('"all:"')
          expect(err.message).toContain('xamples')
        })
    })

    it('part names should not have more than one prefix', () => {
      mockFs(getInvalidPartDeclaration({doublePrefix: true}))
      return resolvePlugins(opts)
        .then(shouldHaveThrown)
        .catch((err) => {
          expect(err.message).toContain('index 3')
          expect(err.message).toContain('":"')
          expect(err.message).toContain('xamples')
        })
    })

    it('part names should include plugin name', () => {
      mockFs(getInvalidPartDeclaration({noPluginName: true}))
      return resolvePlugins(opts)
        .then(shouldHaveThrown)
        .catch((err) => {
          expect(err.message).toContain('index 4')
          expect(err.message).toContain('plugin name')
          expect(err.message).toContain('xamples')
        })
    })

    it('part names should include part name after plugin name', () => {
      mockFs(getInvalidPartDeclaration({noPartName: true}))
      return resolvePlugins(opts)
        .then(shouldHaveThrown)
        .catch((err) => {
          expect(err.message).toContain('index 5')
          expect(err.message).toContain('after the plugin name')
          expect(err.message).toContain('xamples')
        })
    })

    it('parts with `path` should contain `implements` or `name`', () => {
      mockFs(getInvalidPartDeclaration({missingImplements: true}))
      return resolvePlugins(opts)
        .then(shouldHaveThrown)
        .catch((err) => {
          expect(err.message).toContain('index 6')
          expect(err.message).toContain('either `name` or `implements`')
        })
    })

    it('parts with `path` should contain `implements` or `name`', () => {
      mockFs(getInvalidPartDeclaration({missingName: true}))
      return resolvePlugins(opts)
        .then(shouldHaveThrown)
        .catch((err) => {
          expect(err.message).toContain('index 7')
          expect(err.message).toContain('either `name` or `implements`')
        })
    })

    it('parts with `implements` should contain `path`', () => {
      mockFs(getInvalidPartDeclaration({missingPath: true}))
      return resolvePlugins(opts)
        .then(shouldHaveThrown)
        .catch((err) => {
          expect(err.message).toContain('index 8')
        })
    })
  })

  it('rejects on missing plugin', () => {
    mockFs(getDeepTree({missingPlugin: true}))
    return expect(resolvePlugins(opts)).rejects.toMatchObject({message: /"missing"/})
  })

  it('rejects on missing plugin manifest', () => {
    mockFs(getDeepTree({missingManifest: true}))
    return expect(resolvePlugins(opts)).rejects.toMatchObject({message: /"sanity\.json"/})
  })

  it('rejects if two plugins define the same part', () => {
    mockFs(getDuplicatePartTree())
    return expect(resolveParts(opts)).rejects.toMatchObject({
      message: /both define part "part:snarkel\/foo"/,
    })
  })

  it('resolves plugins in the right order', () => {
    mockFs(getDeepTree())
    return resolvePlugins(opts).then((plugins) => {
      expect(plugins.map((plugin) => plugin.name)).toEqual([
        '@sanity/default-layout',
        '@sanity/core',
        'baz',
        'bar',
        'foo',
        '(project root)',
      ])
    })
  })

  it('does not list duplicate plugins multiple times', () => {
    mockFs(getDuplicatePluginTree())
    return resolvePlugins(opts).then((plugins) => {
      expect(plugins).toHaveLength(3)
    })
  })

  it('allows resolving plugins synchronously', () => {
    mockFs(getDeepTree())
    const plugins = resolvePlugins(syncOpts)
    expect(plugins.map((plugin) => plugin.name)).toEqual([
      '@sanity/default-layout',
      '@sanity/core',
      'baz',
      'bar',
      'foo',
      '(project root)',
    ])
  })

  describe('respects the sanity plugin resolution order', () => {
    it('prefers fully qualified, local path (/plugins/sanity-plugin-<name>)', () => {
      mockFs(getResolutionOrderFixture({chosenMethod: 'fullLocalPath'}))
      return resolvePlugins(opts).then((plugins) => {
        expect(plugins[0].path).toBe('/sanity/plugins/sanity-plugin-bar')
      })
    })

    it('prefers short-named, local path as 2nd option (/plugins/<name>)', () => {
      mockFs(getResolutionOrderFixture({chosenMethod: 'shortLocalPath'}))
      return resolvePlugins(opts).then((plugins) => {
        expect(plugins[0].path).toBe('/sanity/plugins/bar')
      })
    })

    const subPath = '/node_modules/sanity-plugin-<parent>/node_modules/sanity-plugin-<name>'
    it(`prefers fully qualified in parent plugin node_modules as 3rd option (${subPath})`, () => {
      mockFs(getResolutionOrderFixture({chosenMethod: 'subNodeModules'}))
      return resolvePlugins(opts).then((plugins) => {
        expect(plugins[0].path).toBe(
          '/sanity/node_modules/sanity-plugin-foo/node_modules/sanity-plugin-bar'
        )
      })
    })

    it('prefers fully qualified in root node_modules as 4th option (/node_modules/sanity-plugin-<name>)', () => {
      mockFs(getResolutionOrderFixture({chosenMethod: 'nodeModules'}))
      return resolvePlugins(opts).then((plugins) => {
        expect(plugins[0].path).toBe('/sanity/node_modules/sanity-plugin-bar')
      })
    })

    it('follows the node resolution algorithm (trickles down directory tree)', () => {
      mockFs(getNodeResolutionTree())
      const resolveOpts = Object.assign({}, opts, {basePath: '/sanity/app'})
      return resolvePlugins(resolveOpts).then((plugins) => {
        expect(plugins[0].path).toBe('/sanity/node_modules/@sanity/default-layout')
        expect(plugins[1].path).toBe('/sanity/node_modules/@sanity/core')
        expect(plugins[2].path).toBe('/node_modules/@sanity/strawberry')
        expect(plugins[3].path).toBe('/node_modules/sanity-plugin-rebeltastic')
        expect(plugins[4].path).toBe('/sanity/app')
      })
    })
  })

  it('can resolve parts for a basic setup', () => {
    mockFs(getBasicTree())
    return resolveParts(opts).then((res) => {
      const settings = res.definitions['part:@sanity/default-layout/settingsPane']
      expect(settings.path).toBe('/sanity/node_modules/@sanity/default-layout')

      const tool = res.implementations['part:@sanity/default-layout/tool']
      expect(tool).toHaveLength(2)
      expect(tool[0]).toEqual({
        plugin: 'instagram',
        path: '/sanity/node_modules/sanity-plugin-instagram/lib/components/InstagramTool',
      })

      const main = res.implementations['part:@sanity/core/root']
      expect(main).toHaveLength(1)
      expect(main[0]).toEqual({
        plugin: '@sanity/default-layout',
        path: '/sanity/node_modules/@sanity/default-layout/lib/components/Root',
      })

      const comments = res.implementations['part:instagram/commentsList']
      expect(comments[0]).toEqual({
        plugin: 'instagram',
        path: '/sanity/node_modules/sanity-plugin-instagram/lib/components/CommentsList',
      })
    })
  })

  it('resolves plugins as well as parts', () => {
    mockFs(getBasicTree())
    return resolveParts(opts).then((res) => {
      expect(res.plugins).toHaveLength(4)
      expect(res.plugins.map((plugin) => plugin.path)).toEqual([
        '/sanity/node_modules/@sanity/default-layout',
        '/sanity/node_modules/@sanity/core',
        '/sanity/node_modules/sanity-plugin-instagram',
        '/sanity',
      ])
    })
  })

  it('can resolve parts synchronously', () => {
    mockFs(getBasicTree())

    const res = resolveParts(syncOpts)
    expect(res.plugins).toHaveLength(4)
    expect(res.plugins.map((plugin) => plugin.path)).toEqual([
      '/sanity/node_modules/@sanity/default-layout',
      '/sanity/node_modules/@sanity/core',
      '/sanity/node_modules/sanity-plugin-instagram',
      '/sanity',
    ])
  })

  it('doesnt try to look up the same location twice', () => {
    mockFs(getScopedPluginsTree())
    return resolveParts(opts).catch((err) => {
      expect(
        err.locations.some((location, index) => err.locations.indexOf(location, index + 1) !== -1)
      ).toBe(false)
    })
  })

  it('resolves path to "compiled" path for node_modules, "source" for plugins', () => {
    mockFs(getMixedPluginTree())
    return resolveParts(opts).then((res) => {
      expect(res.implementations['part:@sanity/default-layout/tool'][0]).toEqual({
        plugin: 'foo',
        path: '/sanity/plugins/foo/src/File',
      })

      expect(res.implementations['part:@sanity/default-layout/tool'][1]).toEqual({
        plugin: 'instagram',
        path: '/sanity/node_modules/sanity-plugin-instagram/lib/components/InstagramTool',
      })
    })
  })

  it('resolves path to "compiled" if "useCompiledPaths"-option is set to true', () => {
    mockFs(getMixedPluginTree())
    return resolveParts(Object.assign({}, opts, {useCompiledPaths: true})).then((res) => {
      expect(res.implementations['part:@sanity/default-layout/tool'][0]).toEqual({
        plugin: 'foo',
        path: '/sanity/plugins/foo/lib/File',
      })

      expect(res.implementations['part:@sanity/default-layout/tool'][1]).toEqual({
        plugin: 'instagram',
        path: '/sanity/node_modules/sanity-plugin-instagram/lib/components/InstagramTool',
      })
    })
  })

  it('treats dot-paths as relative to sanity.json, absolute as absolute', () => {
    mockFs(getPathAlternatives())
    return resolveParts(opts).then((res) => {
      expect(res.implementations['part:foo/relative'][0]).toEqual({
        plugin: 'foo',
        path: '/sanity/plugins/foo/src/relative/Path.js',
      })

      expect(res.implementations['part:foo/absolute'][0]).toEqual({
        plugin: 'foo',
        path: '/absolute/path/to/File.js',
      })

      expect(res.implementations['part:foo/dot-path'][0]).toEqual({
        plugin: 'foo',
        path: '/sanity/plugins/foo/locale/en-us.json',
      })
    })
  })

  it('late-defined plugins assign themselves to the start of the fulfillers list', () => {
    mockFs(getMixedPluginTree())
    return resolveParts(opts).then((res) => {
      const fulfillers = res.implementations['part:instagram/commentsList']
      expect(fulfillers).toHaveLength(2)
      expect(fulfillers[0]).toEqual({
        plugin: 'foo',
        path: '/sanity/plugins/foo/src/InstaComments',
      })
    })
  })

  it('resolves multi-fulfiller parts correctly', () => {
    mockFs(getMultiTree())
    return resolveParts(opts).then((res) => {
      expect(res.definitions).toHaveProperty('part:@sanity/base/absolute')
      expect(res.implementations).toHaveProperty('part:@sanity/base/absolute')
      expect(res.implementations['part:@sanity/base/absolute']).toHaveLength(2)
    })
  })

  it('handles style parts as regular parts', () => {
    mockFs(getStyleTree())
    return resolveParts(opts).then((res) => {
      expect(res.implementations['part:@sanity/default-layout/header-style']).toEqual([
        {
          path: '/sanity/node_modules/sanity-plugin-screaming-dev-badge/css/scream.css',
          plugin: 'screaming-dev-badge',
        },
        {
          path: '/sanity/node_modules/sanity-plugin-material-design/css/header.css',
          plugin: 'material-design',
        },
        {
          path: '/sanity/node_modules/@sanity/default-layout/css/header.css',
          plugin: '@sanity/default-layout',
        },
      ])
    })
  })

  it('allows a part to both implement a part and define a new one', () => {
    mockFs(getStyleOverriderTree())
    return resolveParts(opts).then((res) => {
      expect(res.definitions).toHaveProperty('part:foo/button-style')
      expect(res.definitions).toHaveProperty('part:foo/button-default-style')

      expect(res.implementations).toHaveProperty('part:foo/button-style')
      expect(res.implementations).toHaveProperty('part:foo/button-default-style')
    })
  })

  it('does not allow a non-abstract part to be implemented by others', () => {
    mockFs(getNonAbstractPartTree())
    return expect(resolveParts(opts)).rejects.toMatchObject({message: /both define part/})
  })

  it('should include parts defined in base manifest', () => {
    mockFs(getRootLevelPartsTree())
    return resolveParts(opts).then((res) => {
      expect(res.definitions).toHaveProperty('part:@sanity/config/schema')
      expect(res.definitions['part:@sanity/config/schema'].path).toBe('/sanity')

      expect(res.implementations).toHaveProperty('part:@sanity/config/schema')
      expect(res.implementations['part:@sanity/config/schema'][0].path).toEqual(
        path.join('/sanity', 'schema', 'schema.js')
      )

      const last = res.plugins[res.plugins.length - 1]
      expect(last.name).toBe('(project root)')
      expect(last.path).toBe('/sanity')
    })
  })

  it('should treat base manifest parts as most significant', () => {
    mockFs(getRootLevelPartsTree({}))
    return resolveParts(opts).then((res) => {
      expect(res.definitions).toHaveProperty('part:@sanity/core/root')
      expect(res.definitions['part:@sanity/core/root'].plugin).toBe('@sanity/core')

      expect(res.implementations).toHaveProperty('part:@sanity/core/root')
      expect(res.implementations['part:@sanity/core/root'][0].path).toBe(
        '/sanity/myRootComponent.js'
      )
    })
  })

  it('should be able to find project root synchronously by looking for `root` prop', () => {
    mockFs(getResolutionOrderFixture({chosenMethod: 'subNodeModules'}))

    const rootPath = resolveProjectRoot({
      basePath: '/sanity/node_modules/sanity-plugin-foo/node_modules/sanity-plugin-bar',
      sync: true,
    })

    expect(rootPath).toBe('/sanity')
  })

  it('should resolve project root if option is passed', () => {
    mockFs(getResolutionOrderFixture({chosenMethod: 'subNodeModules'}))

    return resolveParts({
      basePath: '/sanity/node_modules/sanity-plugin-foo/node_modules/sanity-plugin-bar',
      resolveProjectRoot: true,
    }).then((parts) => {
      expect(parts.plugins[parts.plugins.length - 1].path).toBe('/sanity')
    })
  })

  it('can resolve relative paths as plugins', () => {
    mockFs(getParentDirTree())

    return resolveParts({basePath: '/sanity/app'}).then((parts) => {
      expect(Object.keys(parts.plugins[3])).toEqual(
        expect.arrayContaining(['name', 'path', 'manifest'])
      )

      expect(parts.implementations['part:my-parent-plugin/foo/bar'][0]).toEqual({
        plugin: 'my-parent-plugin',
        path: '/sanity/my-parent-plugin/foobar.js',
      })
    })
  })
})

function shouldHaveThrown() {
  assert.fail('Result', 'Error', 'Test should have fail, instead succeeded', '!=')
}
