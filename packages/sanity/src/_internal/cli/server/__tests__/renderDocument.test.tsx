import {JSDOM} from 'jsdom'
import {renderToStaticMarkup} from 'react-dom/server'
import {describe, expect, it} from 'vitest'

import {TIMESTAMPED_IMPORTMAP_INJECTOR_SCRIPT} from '../constants'
import {_prefixUrlWithBasePath, addTimestampedImportMapScriptToHtml} from '../renderDocument'

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

describe('addTimestampedImportMapScriptToHtml', () => {
  const importMap = {
    imports: {
      react: 'https://example.com/react',
    },
  }

  it('takes the import map from the `#__imports` script tag synchronously creates an importmap', () => {
    const importMapWithSanityTimestamps = {
      ...importMap,
      imports: {
        ...importMap.imports,
        'sanity': 'https://sanity-cdn.work/v1/modules/sanity/default/%5E3.40.0/t12345',
        'sanity/': 'https://sanity-cdn.work/v1/modules/sanity/default/%5E3.40.0/t12345/',
        '@sanity/vision':
          'https://sanity-cdn.work/v1/modules/@sanity__vision/default/%5E3.40.0/t12345',
        '@sanity/vision/':
          'https://sanity-cdn.work/v1/modules/@sanity__vision/default/%5E3.40.0/t12345/',
      },
    }

    const input = `<html lang="en">
        <head><meta charSet="utf-8" /><title>Sanity Studio</title></head>
        <body><div id="sanity"/></body>
      </html>`

    const output = `<html lang="en">
        <head><meta charSet="utf-8" ><title>Sanity Studio</title><script type="application/json" id="__imports">{"imports":{"react":"https://example.com/react","sanity":"https://sanity-cdn.work/v1/modules/sanity/default/%5E3.40.0/t12345","sanity/":"https://sanity-cdn.work/v1/modules/sanity/default/%5E3.40.0/t12345/","@sanity/vision":"https://sanity-cdn.work/v1/modules/@sanity__vision/default/%5E3.40.0/t12345","@sanity/vision/":"https://sanity-cdn.work/v1/modules/@sanity__vision/default/%5E3.40.0/t12345/"}}</script>${TIMESTAMPED_IMPORTMAP_INJECTOR_SCRIPT}</head>
        <body><div id="sanity"></div></body>
      </html>`

    expect(addTimestampedImportMapScriptToHtml(input, importMapWithSanityTimestamps)).toBe(output)

    const {document} = new JSDOM(output, {runScripts: 'dangerously'}).window
    const staticImportMap = JSON.parse(document.querySelector('#__imports')?.textContent as string)
    const runtimeImportMap = JSON.parse(
      document.querySelector('script[type="importmap"]')?.textContent as string,
    )

    expect(runtimeImportMap).toMatchObject({
      imports: {
        'react': 'https://example.com/react',
        'sanity': expect.stringMatching(
          /^https:\/\/sanity-cdn\.work\/v1\/modules\/sanity\/default\/%5E3\.40\.0\/t\d+$/,
        ),
        'sanity/': expect.stringMatching(
          // notice the trailing slash here
          /^https:\/\/sanity-cdn\.work\/v1\/modules\/sanity\/default\/%5E3\.40\.0\/t\d+\/$/,
        ),
        '@sanity/vision': expect.stringMatching(
          /^https:\/\/sanity-cdn\.work\/v1\/modules\/@sanity__vision\/default\/%5E3\.40\.0\/t\d+$/,
        ),
        '@sanity/vision/': expect.stringMatching(
          // notice the trailing slash here
          /^https:\/\/sanity-cdn\.work\/v1\/modules\/@sanity__vision\/default\/%5E3\.40\.0\/t\d+\/$/,
        ),
      },
    })

    // ensures that the timestamps have actually been replaced
    expect(staticImportMap).not.toEqual(runtimeImportMap)
  })

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
    const output = `<html lang="en"><head><meta charSet="utf-8"><title>Sanity Studio</title><script type="application/json" id="__imports">{"imports":{"react":"https://example.com/react"}}</script>${TIMESTAMPED_IMPORTMAP_INJECTOR_SCRIPT}</head><body><div id="sanity"></div></body></html>`

    expect(addTimestampedImportMapScriptToHtml(input, importMap)).toBe(output)
  })

  it('creates an <html> element if none exist', () => {
    const input = 'foo<div>bar</div>baz'
    const output = `<html><head><script type="application/json" id="__imports">{"imports":{"react":"https://example.com/react"}}</script>${TIMESTAMPED_IMPORTMAP_INJECTOR_SCRIPT}</head>foo<div>bar</div>baz</html>`

    expect(addTimestampedImportMapScriptToHtml(input, importMap)).toBe(output)
  })

  it('creates a <head> to the document if one does not exist', () => {
    const input = '<html><body><script src="index.js"></script></body></html>'
    const output = `<html><head><script type="application/json" id="__imports">{"imports":{"react":"https://example.com/react"}}</script>${TIMESTAMPED_IMPORTMAP_INJECTOR_SCRIPT}</head><body><script src="index.js"></script></body></html>`

    expect(addTimestampedImportMapScriptToHtml(input, importMap)).toBe(output)
  })
})
