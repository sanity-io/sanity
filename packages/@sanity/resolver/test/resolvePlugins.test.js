import {afterEach, describe, it} from 'mocha'
import {getBasicTree, getDeepTree, getInvalidJson, getInvalidManifest, getResolutionOrderFixture} from './fixtures'
import resolvePlugins, {resolveRoles} from '../src/resolver'
import mockFs from 'mock-fs'

describe('plugin resolver', () => {
  afterEach(() => {
    mockFs.restore()
  })

  it('rejects on invalid root-level JSON', () => {
    mockFs(getInvalidJson({atRoot: true}))
    return resolvePlugins({basePath: '/sanity'}).should.be.rejectedWith(SyntaxError)
  })

  it('rejects on invalid non-root-level JSON', () => {
    mockFs(getInvalidJson({atRoot: false}))
    return resolvePlugins({basePath: '/sanity'}).should.be.rejectedWith(SyntaxError)
  })

  it('rejects on invalid root-level manifest', () => {
    mockFs(getInvalidManifest({atRoot: true}))
    return resolvePlugins({basePath: '/sanity'}).should.be.rejectedWith(/ValidationError/, /must be an array/)
  })

  it('rejects on invalid non-root-level manifest', () => {
    mockFs(getInvalidManifest({atRoot: false}))
    return resolvePlugins({basePath: '/sanity'}).should.be.rejectedWith(/ValidationError/, /must be an array/)
  })

  it('rejects on missing plugin', () => {
    mockFs(getDeepTree({missingPlugin: true}))
    return resolvePlugins({basePath: '/sanity'}).should.be.rejectedWith(/Error/, /"missing"/)
  })

  it('rejects on missing plugin manifest', () => {
    mockFs(getDeepTree({missingManifest: true}))
    return resolvePlugins({basePath: '/sanity'}).should.be.rejectedWith(/Error/, /"sanity\.json"/)
  })

  it('resolves plugins in the right order', () => {
    mockFs(getDeepTree())
    return resolvePlugins({basePath: '/sanity'}).then(plugins => {
      plugins.map(plugin => plugin.name).should.eql([
        '@sanity/standard-layout',
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
      return resolvePlugins({basePath: '/sanity'}).then(plugins => {
        plugins[0].path.should.equal('/sanity/plugins/sanity-plugin-bar')
      })
    })

    it('prefers short-named, local path as 2nd option (/plugins/<name>)', () => {
      mockFs(getResolutionOrderFixture({chosenMethod: 'shortLocalPath'}))
      return resolvePlugins({basePath: '/sanity'}).then(plugins => {
        plugins[0].path.should.equal('/sanity/plugins/bar')
      })
    })

    const subPath = '/node_modules/sanity-plugin-<parent>/node_modules/sanity-plugin-<name>'
    it(`prefers fully qualified in parent plugin node_modules as 3rd option (${subPath})`, () => {
      mockFs(getResolutionOrderFixture({chosenMethod: 'subNodeModules'}))
      return resolvePlugins({basePath: '/sanity'}).then(plugins => {
        plugins[0].path.should.equal('/sanity/node_modules/sanity-plugin-foo/node_modules/sanity-plugin-bar')
      })
    })

    it('prefers fully qualified in root node_modules as 4th option (/node_modules/sanity-plugin-<name>)', () => {
      mockFs(getResolutionOrderFixture({chosenMethod: 'nodeModules'}))
      return resolvePlugins({basePath: '/sanity'}).then(plugins => {
        plugins[0].path.should.equal('/sanity/node_modules/sanity-plugin-bar')
      })
    })
  })

  it('can resolve roles for a basic setup', () => {
    mockFs(getBasicTree())
    resolveRoles({basePath: '/sanity'}).then(res => {
      const settings = res.provided['standard-layout/settings-pane']
      settings.path.should.equal('/sanity/node_modules/@sanity/standard-layout')
      settings.multi.should.equal(true)

      const tool = res.fulfilled['standard-layout/tool']
      tool.should.have.length(2)
      tool[0].should.eql({
        plugin: 'instagram',
        path: '/sanity/node_modules/sanity-plugin-instagram/src/components/InstagramTool'
      })

      const main = res.fulfilled['core/mainComponent']
      main.should.eql({
        plugin: '@sanity/standard-layout',
        path: '/sanity/node_modules/@sanity/standard-layout/src/components/Main'
      })
    })
  })

  it.skip('does something', () => {
    mockFs(getDeepTree())
    return resolvePlugins({basePath: '/sanity'}).then(res => {
      console.log(require('util').inspect(res, {
        depth: 10,
        colors: true
      }))
    })
  })
})
