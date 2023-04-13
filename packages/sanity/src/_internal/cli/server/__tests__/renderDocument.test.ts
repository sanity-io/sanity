import {_prefixUrlWithBasePath} from '../renderDocument'

describe('_prefixUrlWithBasePath', () => {
  describe('when basePath is default value of "/"', () => {
    it('returns the without double slash', () => {
      const url = '/test'
      const basePath = '/'
      const prefixedUrl = _prefixUrlWithBasePath(url, basePath)
      expect(prefixedUrl).toEqual(url)
    })

    it('returns with single slash', () => {
      const url = 'test'
      const basePath = '/'
      const prefixedUrl = _prefixUrlWithBasePath(url, basePath)
      expect(prefixedUrl).toEqual(`/${url}`)
    })
  })

  describe("when basePath is '/basePath/studio'", () => {
    it('prefixes a url that starts with /', () => {
      const url = '/test'
      const basePath = '/basePath/studio'
      const prefixedUrl = _prefixUrlWithBasePath(url, basePath)
      expect(prefixedUrl).toEqual('/basePath/studio/test')
    })

    it('returns the original url that does not start with /', () => {
      const url = 'test'
      const basePath = '/basePath/studio'
      const prefixedUrl = _prefixUrlWithBasePath(url, basePath)
      expect(prefixedUrl).toEqual('/basePath/studio/test')
    })
  })

  describe("when basePath is 'basePath/studio/'", () => {
    it('prefixes a url that starts with /', () => {
      const url = '/test'
      const basePath = 'basePath/studio/'
      const prefixedUrl = _prefixUrlWithBasePath(url, basePath)
      expect(prefixedUrl).toEqual('/basePath/studio/test')
    })

    it('returns the original url that does not start with /', () => {
      const url = 'test'
      const basePath = 'basePath/studio/'
      const prefixedUrl = _prefixUrlWithBasePath(url, basePath)
      expect(prefixedUrl).toEqual('/basePath/studio/test')
    })
  })

  describe("when basePath is '/basePath/studio/'", () => {
    it('prefixes a url that starts with /', () => {
      const url = '/test'
      const basePath = '/basePath/studio/'
      const prefixedUrl = _prefixUrlWithBasePath(url, basePath)
      expect(prefixedUrl).toEqual('/basePath/studio/test')
    })

    it('returns the original url that does not start with /', () => {
      const url = 'test'
      const basePath = '/basePath/studio/'
      const prefixedUrl = _prefixUrlWithBasePath(url, basePath)
      expect(prefixedUrl).toEqual('/basePath/studio/test')
    })
  })
})
