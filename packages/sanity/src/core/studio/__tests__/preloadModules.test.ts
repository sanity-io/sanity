import {afterEach, describe, expect, it, vi} from 'vitest'

async function loadPreloadStudioModules() {
  vi.resetModules()
  return (await import('../preloadModules')).preloadStudioModules
}

function modulePreloads() {
  return [...document.head.querySelectorAll<HTMLLinkElement>('link[rel="modulepreload"]')]
}

describe('preloadStudioModules', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    modulePreloads().forEach((link) => link.remove())
  })

  it('preloads nothing when the build has no list', async () => {
    const preloadStudioModules = await loadPreloadStudioModules()

    preloadStudioModules()

    expect(modulePreloads()).toEqual([])
  })

  it('preloads each module of the list, resolved against this module', async () => {
    vi.stubGlobal('__SANITY_PRELOAD_MODULES__', ['./AuthenticatedStudio-abc.mjs', './dep-def.mjs'])
    const preloadStudioModules = await loadPreloadStudioModules()

    preloadStudioModules()

    const hrefs = modulePreloads().map((link) => link.getAttribute('href')!)
    expect(hrefs.map((href) => new URL(href).pathname.split('/src/core/studio/')[1])).toEqual([
      'AuthenticatedStudio-abc.mjs',
      'dep-def.mjs',
    ])
    expect(modulePreloads().map((link) => link.hasAttribute('crossorigin'))).toEqual([true, true])
  })

  it('skips specifiers that are not plain relative paths on the origin of this module', async () => {
    vi.stubGlobal('__SANITY_PRELOAD_MODULES__', [
      'https://other.example/chunk.mjs',
      '//other.example/chunk.mjs',
      '/chunk.mjs',
      '../chunk.mjs',
      './kept.mjs',
    ])
    const preloadStudioModules = await loadPreloadStudioModules()

    preloadStudioModules()

    const hrefs = modulePreloads().map((link) => link.getAttribute('href')!)
    expect(hrefs.map((href) => new URL(href).pathname.split('/src/core/studio/')[1])).toEqual([
      'kept.mjs',
    ])
  })
})
