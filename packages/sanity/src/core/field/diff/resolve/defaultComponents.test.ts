import {describe, expect, it, vi} from 'vitest'

const cycleEntries = [
  {
    name: 'block',
    loadComponent: () =>
      import('../../types/portableText/diff/PTDiff').then((module) => module.PTDiff),
  },
  {
    name: 'image',
    loadComponent: () =>
      import('../../types/image/diff/ImageFieldDiff').then((module) => module.ImageFieldDiff),
  },
  {
    name: 'file',
    loadComponent: () =>
      import('../../types/file/diff/FileFieldDiff').then((module) => module.FileFieldDiff),
  },
]

describe('getDefaultDiffComponent', () => {
  it.each(cycleEntries)(
    'resolves $name when its own module loads first',
    async ({name, loadComponent}) => {
      vi.resetModules()
      const component = await loadComponent()
      const {getDefaultDiffComponent} = await import('./defaultComponents')

      expect(getDefaultDiffComponent(name)).toBe(component)
    },
  )
})
