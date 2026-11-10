import {describe, expect, test} from 'vitest'

import {isForeignDocument, isFromForeignFrame} from './foreignFrames'

const STUDIO_ORIGIN = 'http://localhost:3339'
const STUDIO = `${STUDIO_ORIGIN}/chromium/presentation`
const PREVIEW_ORIGIN = 'https://test-studio-preview-iframe.sanity.dev'
const PREVIEW = `${PREVIEW_ORIGIN}/?sanity-preview-perspective=drafts`

const presentation = {main: STUDIO, children: [PREVIEW]}

// The messages are those Chromium and Firefox throw for a read of a cross-origin window.
const chromiumBlockedAccess = (origin: string) =>
  `Failed to read a named property '__REACT_DEVTOOLS_GLOBAL_HOOK__' from 'Window': Blocked a frame with origin "${origin}" from accessing a cross-origin frame.`
const FIREFOX_BLOCKED_ACCESS =
  'Permission denied to access property "__REACT_DEVTOOLS_GLOBAL_HOOK__" on cross-origin object'

describe('isFromForeignFrame', () => {
  test('a child frame reaching into the studio, which Chromium reports without a location', () => {
    expect(
      isFromForeignFrame({url: '', message: chromiumBlockedAccess(PREVIEW_ORIGIN)}, presentation),
    ).toBe(true)
  })

  test('a child frame reaching into the studio, which Firefox locates in the frame', () => {
    expect(isFromForeignFrame({url: PREVIEW, message: FIREFOX_BLOCKED_ACCESS}, presentation)).toBe(
      true,
    )
  })

  test('an error thrown by a script of a child frame', () => {
    expect(
      isFromForeignFrame(
        {url: `${PREVIEW_ORIGIN}/assets/index-B2x9.js`, message: 'Cannot read properties of null'},
        presentation,
      ),
    ).toBe(true)
  })

  test('an error thrown by a script of the studio', () => {
    expect(
      isFromForeignFrame(
        {url: `${STUDIO_ORIGIN}/static/sanity-Dk3v.js`, message: 'Cannot read properties of null'},
        presentation,
      ),
    ).toBe(false)
  })

  test('the studio reaching into a child frame', () => {
    expect(
      isFromForeignFrame({url: '', message: chromiumBlockedAccess(STUDIO_ORIGIN)}, presentation),
    ).toBe(false)
    expect(isFromForeignFrame({url: STUDIO, message: FIREFOX_BLOCKED_ACCESS}, presentation)).toBe(
      false,
    )
  })

  test('a script the studio loads from another origin than its own', () => {
    expect(
      isFromForeignFrame(
        {url: 'https://sanity-cdn.com/v1/modules/sanity/default/%5E4/t1759219200', message: 'x'},
        presentation,
      ),
    ).toBe(false)
  })

  test('an origin that no child frame has, such as that of a frame removed since', () => {
    expect(
      isFromForeignFrame(
        {url: '', message: chromiumBlockedAccess(PREVIEW_ORIGIN)},
        {main: STUDIO, children: []},
      ),
    ).toBe(false)
  })

  test('an error without a location or an origin in its message', () => {
    expect(isFromForeignFrame({url: '', message: 'Script error.'}, presentation)).toBe(false)
  })

  test('a page without an origin of its own', () => {
    expect(
      isFromForeignFrame(
        {url: `${PREVIEW_ORIGIN}/assets/index-B2x9.js`, message: 'x'},
        {main: 'about:blank', children: [PREVIEW]},
      ),
    ).toBe(false)
  })
})

describe('isForeignDocument', () => {
  test('a document of another origin than the page', () => {
    expect(isForeignDocument(PREVIEW, STUDIO)).toBe(true)
    expect(isForeignDocument(`blob:${PREVIEW_ORIGIN}/0b1c2d3e`, STUDIO)).toBe(true)
  })

  test('a document of the origin of the page', () => {
    expect(isForeignDocument(`${STUDIO_ORIGIN}/chromium/content`, STUDIO)).toBe(false)
    expect(isForeignDocument(`blob:${STUDIO_ORIGIN}/0b1c2d3e`, STUDIO)).toBe(false)
  })

  test.each(['about:blank', 'about:srcdoc', 'data:text/html,<p>', ''])(
    'a document without an origin of its own: %j',
    (url) => {
      expect(isForeignDocument(url, STUDIO)).toBe(false)
    },
  )

  test('a page without an origin of its own', () => {
    expect(isForeignDocument(PREVIEW, 'about:blank')).toBe(false)
  })
})
