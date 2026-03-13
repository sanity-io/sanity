import {type AssetSource} from '@sanity/types'
import {describe, expect, it} from 'vitest'

import {
  getAssetSourceDisplayName,
  getAssetSourcesWithUpload,
  hasUploadSupport,
  isComponentModeAssetSource,
} from '../assetSourceUtils'

describe('assetSourceUtils', () => {
  describe('hasUploadSupport', () => {
    it('returns true when source has Uploader', () => {
      const source: AssetSource = {
        name: 'with-uploader',
        component: () => null,
        Uploader: {},
      } as AssetSource
      expect(hasUploadSupport(source)).toBe(true)
    })

    it('returns true when source has uploadMode component', () => {
      const source: AssetSource = {
        name: 'component-mode',
        component: () => null,
        uploadMode: 'component',
      } as AssetSource
      expect(hasUploadSupport(source)).toBe(true)
    })

    it('returns false when source has neither Uploader nor component uploadMode', () => {
      const source: AssetSource = {
        name: 'no-upload',
        component: () => null,
      } as AssetSource
      expect(hasUploadSupport(source)).toBe(false)
    })
  })

  describe('isComponentModeAssetSource', () => {
    it('returns true when uploadMode is component', () => {
      const source: AssetSource = {
        name: 'component-mode',
        component: () => null,
        uploadMode: 'component',
      } as AssetSource
      expect(isComponentModeAssetSource(source)).toBe(true)
    })

    it('returns false when uploadMode is not component (picker mode)', () => {
      const source: AssetSource = {
        name: 'picker-mode',
        component: () => null,
        Uploader: {},
      } as AssetSource
      expect(isComponentModeAssetSource(source)).toBe(false)
    })

    it('returns false when uploadMode is undefined', () => {
      const source: AssetSource = {
        name: 'no-mode',
        component: () => null,
      } as AssetSource
      expect(isComponentModeAssetSource(source)).toBe(false)
    })
  })

  describe('getAssetSourcesWithUpload', () => {
    it('filters sources to only those with upload support', () => {
      const withUpload: AssetSource = {
        name: 'with-upload',
        component: () => null,
        Uploader: {},
      } as AssetSource
      const withoutUpload: AssetSource = {
        name: 'without-upload',
        component: () => null,
      } as AssetSource
      const componentMode: AssetSource = {
        name: 'component',
        component: () => null,
        uploadMode: 'component',
      } as AssetSource

      const result = getAssetSourcesWithUpload([withUpload, withoutUpload, componentMode])
      expect(result).toHaveLength(2)
      expect(result).toContain(withUpload)
      expect(result).toContain(componentMode)
      expect(result).not.toContain(withoutUpload)
    })

    it('returns empty array when no sources have upload support', () => {
      const sources: AssetSource[] = [
        {name: 'a', component: () => null} as AssetSource,
        {name: 'b', component: () => null} as AssetSource,
      ]
      expect(getAssetSourcesWithUpload(sources)).toHaveLength(0)
    })

    it('returns empty array for empty input', () => {
      expect(getAssetSourcesWithUpload([])).toEqual([])
    })
  })

  describe('getAssetSourceDisplayName', () => {
    const t = (key: string) => `translated:${key}`

    it('uses i18n translation when i18nKey is present', () => {
      const source: AssetSource = {
        name: 'my-source',
        i18nKey: 'inputs.file.source.my-source',
        component: () => null,
      } as AssetSource
      expect(getAssetSourceDisplayName(source, t)).toBe('translated:inputs.file.source.my-source')
    })

    it('falls back to title when no i18nKey', () => {
      const source: AssetSource = {
        name: 'my-source',
        title: 'My Source Title',
        component: () => null,
      } as AssetSource
      expect(getAssetSourceDisplayName(source, t)).toBe('My Source Title')
    })

    it('falls back to name when no i18nKey or title', () => {
      const source: AssetSource = {
        name: 'my-source',
        component: () => null,
      } as AssetSource
      expect(getAssetSourceDisplayName(source, t)).toBe('my-source')
    })

    it('applies startCase to name when useStartCaseForName is true', () => {
      const source: AssetSource = {
        name: 'my-source-name',
        component: () => null,
      } as AssetSource
      expect(getAssetSourceDisplayName(source, t, {useStartCaseForName: true})).toBe(
        'My Source Name',
      )
    })

    it('returns name as-is when useStartCaseForName is false or omitted', () => {
      const source: AssetSource = {
        name: 'my-source-name',
        component: () => null,
      } as AssetSource
      expect(getAssetSourceDisplayName(source, t)).toBe('my-source-name')
      expect(getAssetSourceDisplayName(source, t, {useStartCaseForName: false})).toBe(
        'my-source-name',
      )
    })
  })
})
