import {describe, expect, it} from 'vitest'

import {sanityStudioPlugin} from '../plugin-sanity-studio'

describe('sanityStudioPlugin', () => {
  it('should be importable', () => {
    expect(typeof sanityStudioPlugin).toBe('function')
  })

  it('should return an array of plugins', () => {
    const plugins = sanityStudioPlugin()
    expect(Array.isArray(plugins)).toBe(true)
    expect(plugins.length).toBeGreaterThan(0)
  })

  it('should include main studio plugin', () => {
    const plugins = sanityStudioPlugin()
    const mainPlugin = plugins.find((p) => p.name === 'sanity/studio')
    expect(mainPlugin).toBeDefined()
  })

  it('should include react loader plugin', () => {
    const plugins = sanityStudioPlugin()
    const reactLoader = plugins.find((p) => p.name === 'sanity/studio-react-loader')
    expect(reactLoader).toBeDefined()
  })

  it('should include favicons plugin', () => {
    const plugins = sanityStudioPlugin()
    const favicons = plugins.find((p) => p.name === 'sanity/studio-favicons')
    expect(favicons).toBeDefined()
  })

  it('should respect basePath option', () => {
    const plugins = sanityStudioPlugin({basePath: '/studio'})
    expect(plugins.length).toBeGreaterThan(0)
  })

  it('should respect reactStrictMode option', () => {
    const plugins = sanityStudioPlugin({reactStrictMode: false})
    expect(plugins.length).toBeGreaterThan(0)
  })
})
