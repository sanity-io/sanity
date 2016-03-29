import mockFs from 'mock-fs'
import {afterEach, describe, it} from 'mocha'
import proxyquire from 'proxyquire'
import {
  getDeepTree,
  getInvalidJson,
  getInvalidManifest,
  getStyleVarTree
} from './fixtures'

describe('style variables resolver', () => {
  afterEach(() => {
    mockFs.restore()
  })

  it('rejects on invalid root-level JSON', () => {
    const resolveStyleVariables = getResolver()
    mockFs(getInvalidJson({atRoot: true}))
    return resolveStyleVariables({basePath: '/sanity'}).should.be.rejectedWith(SyntaxError)
  })

  it('rejects on invalid non-root-level JSON', () => {
    const resolveStyleVariables = getResolver()
    mockFs(getInvalidJson({atRoot: false}))
    return resolveStyleVariables({basePath: '/sanity'}).should.be.rejectedWith(SyntaxError)
  })

  it('rejects on invalid root-level manifest', () => {
    const resolveStyleVariables = getResolver()
    mockFs(getInvalidManifest({atRoot: true}))
    return resolveStyleVariables({basePath: '/sanity'}).should.be.rejectedWith(/ValidationError/, /must be an array/)
  })

  it('rejects on invalid non-root-level manifest', () => {
    const resolveStyleVariables = getResolver()
    mockFs(getInvalidManifest({atRoot: false}))
    return resolveStyleVariables({basePath: '/sanity'}).should.be.rejectedWith(/ValidationError/, /must be an array/)
  })

  it('rejects on missing plugin', () => {
    const resolveStyleVariables = getResolver()
    mockFs(getDeepTree({missingPlugin: true}))
    return resolveStyleVariables({basePath: '/sanity'}).should.be.rejectedWith(/Error/, /"missing"/)
  })

  it('rejects on missing plugin manifest', () => {
    const resolveStyleVariables = getResolver()
    mockFs(getDeepTree({missingManifest: true}))
    return resolveStyleVariables({basePath: '/sanity'}).should.be.rejectedWith(/Error/, /"sanity\.json"/)
  })

  it('rejects if fulfiller is not an object', () => {
    const resolveStyleVariables = getResolver({
      '/sanity/plugins/some-overrider/css/vars.js': getVariableOverride({nonObject: true}),
      '/sanity/node_modules/@sanity/base/styleVariables.js': getBaseVars()
    })
    mockFs(getStyleVarTree())
    return resolveStyleVariables({basePath: '/sanity'}).should.be.rejectedWith(/Error/, /plain object.*?"some-overrider"/)
  })

  it('merge variables in first-to-last fulfiller order', () => {
    const resolveStyleVariables = getResolver({
      '/sanity/plugins/some-overrider/css/vars.js': getVariableOverride(),
      '/sanity/node_modules/@sanity/base/styleVariables.js': getBaseVars()
    })
    mockFs(getStyleVarTree())
    return resolveStyleVariables({basePath: '/sanity'}).should.eventually.eql({
      'brand-primary': '#bf1942',
      'text-color': '#c0ffee'
    })
  })
})

function getResolver(mocks) {
  return proxyquire('../src/resolveStyleVariables', mocks || {}).default
}

function getVariableOverride({nonObject} = {}) {
  const demExports = {}
  Object.defineProperty(demExports, '__esModule', {value: true})
  Object.defineProperty(demExports, '@noCallThru', {value: true})
  demExports.default = nonObject ? ['foo', 'bar'] : {'text-color': '#c0ffee'}
  return demExports
}

function getBaseVars() {
  const vars = {
    'brand-primary': '#bf1942',
    'text-color': '#f00baa'
  }

  Object.defineProperty(vars, '@noCallThru', {value: true})
  return vars
}
