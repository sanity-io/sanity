import {describe, expect, it} from '@jest/globals'
import {renderToStaticMarkup} from 'react-dom/server'

import {_prefixUrlWithBasePath, addImportMapToHtml} from '../renderDocument'

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

describe('addImportMapToHtml', () => {
  const importMap = {
    imports: {
      react: 'https://example.com/react',
    },
  }

  it('takes in an existing HTML document and adds the given import map to the end of the head of the document', () => {
    const input = renderToStaticMarkup(
      <html lang="en">
        <head>
          <meta charSet="utf-8" />
          <title>Sanity Studio</title>
        </head>
        <body>
          <div id="sanity" />
        </body>
      </html>,
    )
    const output = addImportMapToHtml(input, importMap)

    expect(output).toBe(
      '<html lang="en"><head><meta charSet="utf-8"><title>Sanity Studio</title><script type="importmap">{"imports":{"react":"https://example.com/react"}}</script></head><body><div id="sanity"></div></body></html>',
    )
  })

  it('creates an <html> element if none exist', () => {
    const input = 'foo<div>bar</div>baz'
    const output =
      '<html><head><script type="importmap">{"imports":{"react":"https://example.com/react"}}</script></head>foo<div>bar</div>baz</html>'

    expect(addImportMapToHtml(input, importMap)).toBe(output)
  })

  it('creates a <head> to the document if one does not exist', () => {
    const input = '<html><body><script src="index.js"></script></body></html>'
    const output =
      '<html><head><script type="importmap">{"imports":{"react":"https://example.com/react"}}</script></head><body><script src="index.js"></script></body></html>'

    expect(addImportMapToHtml(input, importMap)).toBe(output)
  })
})
