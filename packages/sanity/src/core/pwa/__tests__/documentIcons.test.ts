import {beforeEach, describe, expect, test} from 'vitest'

import {readDocumentIcons} from '../documentIcons'

function withHead(html: string): Document {
  document.head.innerHTML = html
  return document
}

beforeEach(() => {
  document.head.innerHTML = ''
})

describe('readDocumentIcons', () => {
  test('reads the favicon set the sanity cli renders into the document', () => {
    const doc = withHead(`
      <link href="/static/favicon.ico" rel="icon" sizes="any">
      <link href="/static/favicon.svg" rel="icon" type="image/svg+xml">
      <link href="/static/apple-touch-icon.png" rel="apple-touch-icon" sizes="180x180">
    `)

    expect(readDocumentIcons(doc)).toEqual([
      {sizes: 'any', src: `${location.origin}/static/favicon.svg`, type: 'image/svg+xml'},
      {sizes: '180x180', src: `${location.origin}/static/apple-touch-icon.png`},
    ])
  })

  test('skips .ico files, which claim sizes="any" without being scalable', () => {
    const doc = withHead('<link href="/favicon.ico" rel="icon" sizes="any">')

    expect(readDocumentIcons(doc)).toEqual([])
  })

  test('skips icons whose resolution the document never declared', () => {
    const doc = withHead('<link href="/logo.png" rel="apple-touch-icon">')

    expect(readDocumentIcons(doc)).toEqual([])
  })

  test('treats a scalable icon as covering every size', () => {
    const doc = withHead('<link href="/logo.svg" rel="icon">')

    expect(readDocumentIcons(doc)).toEqual([{sizes: 'any', src: `${location.origin}/logo.svg`}])
  })

  test('deduplicates links that point at the same file', () => {
    const doc = withHead(`
      <link href="/logo.svg" rel="icon" type="image/svg+xml">
      <link href="/logo.svg" rel="apple-touch-icon" type="image/svg+xml">
    `)

    expect(readDocumentIcons(doc)).toHaveLength(1)
  })
})
