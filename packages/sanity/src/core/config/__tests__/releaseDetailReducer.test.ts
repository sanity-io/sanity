import {describe, expect, it} from 'vitest'

import {getMockWorkspace} from '../../../../test/testUtils/getMockWorkspaceFromConfig'
import {releaseDetailReducer} from '../configPropertyReducers'
import {type PluginOptions} from '../types'

const pluginDetail = () => null
const rootDetail = () => null

function resolve(config: PluginOptions) {
  return releaseDetailReducer({config, initialValue: undefined})
}

describe('releaseDetailReducer', () => {
  it('resolves nothing when no config defines a detail', () => {
    expect(resolve({name: 'root'})).toBeUndefined()
  })

  it('resolves a detail defined by a plugin when the root config has no releases key', () => {
    const config: PluginOptions = {
      name: 'root',
      plugins: [{name: 'plugin', releases: {detail: pluginDetail}}],
    }

    expect(resolve(config)).toBe(pluginDetail)
  })

  it('resolves a detail defined by the root config', () => {
    expect(resolve({name: 'root', releases: {detail: rootDetail}})).toBe(rootDetail)
  })

  it('lets the root config override a plugin', () => {
    const config: PluginOptions = {
      name: 'root',
      plugins: [{name: 'plugin', releases: {detail: pluginDetail}}],
      releases: {detail: rootDetail},
    }

    expect(resolve(config)).toBe(rootDetail)
  })

  it('keeps a plugin detail when the root releases config defines none', () => {
    const config: PluginOptions = {
      name: 'root',
      plugins: [{name: 'plugin', releases: {detail: pluginDetail}}],
      releases: {enabled: true},
    }

    expect(resolve(config)).toBe(pluginDetail)
  })

  it('throws when the detail is not a function', () => {
    const config = {name: 'root', releases: {detail: 'nope'}} as unknown as PluginOptions

    expect(() => resolve(config)).toThrow('Expected `releases.detail` to be a function')
  })
})

describe('releases.detail on the resolved workspace', () => {
  it('exposes a plugin detail when the root config has no releases key', async () => {
    const workspace = await getMockWorkspace({
      config: {releases: undefined, plugins: [{name: 'plugin', releases: {detail: pluginDetail}}]},
    })

    expect(workspace.releases?.detail).toBe(pluginDetail)
  })

  it('exposes the detail when the root config has a releases key', async () => {
    const workspace = await getMockWorkspace({
      config: {releases: {enabled: true, detail: rootDetail}},
    })

    expect(workspace.releases?.detail).toBe(rootDetail)
  })
})
