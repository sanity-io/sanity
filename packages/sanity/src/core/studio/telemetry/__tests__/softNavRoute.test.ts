import {describe, expect, it} from 'vitest'

import {toSoftNavRoute} from '../softNavRoute'

const STUDIO_ORIGIN = 'https://my-studio.sanity.studio'
const TOOL_NAMES = ['structure', 'vision', 'media-library', 'presentation']

function routeFor(path: string, basePath = '/'): string {
  return toSoftNavRoute({
    navigationURL: `${STUDIO_ORIGIN}${path}`,
    basePath,
    toolNames: TOOL_NAMES,
  })
}

describe('toSoftNavRoute', () => {
  it('classifies the root structure pane as a list', () => {
    expect(routeFor('/structure')).toBe('structure:list')
  })

  it('classifies a single-level structure pane as a list', () => {
    expect(routeFor('/structure/author')).toBe('structure:list')
  })

  it('classifies a document pane opened from a list', () => {
    expect(routeFor('/structure/author;knut')).toBe('structure:document')
  })

  it('classifies a document pane carrying params and a payload', () => {
    expect(routeFor('/structure/author;knut,view=detail,eyJmb28iOiJiYXIifQ')).toBe(
      'structure:document',
    )
  })

  it('classifies nested panes by group depth parity (list, document, list, document)', () => {
    expect(routeFor('/structure/author;knut;posts;my-post')).toBe('structure:document')
    expect(routeFor('/structure/author;knut;posts')).toBe('structure:list')
  })

  it('reports a bare tool name for non-structure tools, with no pane kind', () => {
    expect(routeFor('/vision')).toBe('vision')
    expect(routeFor('/vision/anything/goes/here')).toBe('vision')
  })

  it('classifies known intent routes by intent name, unknown intents as other', () => {
    expect(routeFor('/intent/edit/id=abc33')).toBe('intent:edit')
    expect(routeFor('/intent/create/type=book')).toBe('intent:create')
    expect(routeFor('/intent/some-future-intent/id=abc33')).toBe('intent:other')
  })

  it('falls back to other for an unknown tool name', () => {
    expect(routeFor('/some-removed-tool/whatever')).toBe('other')
  })

  it('falls back to other for a URL outside the workspace basePath', () => {
    expect(routeFor('/other-workspace/structure/author', '/my-workspace')).toBe('other')
  })

  it('falls back to other for an empty path', () => {
    expect(routeFor('/')).toBe('other')
  })

  it('falls back to other for an unparseable URL', () => {
    expect(toSoftNavRoute({navigationURL: 'not-a-url', basePath: '/', toolNames: TOOL_NAMES})).toBe(
      'other',
    )
  })

  it('respects a non-root workspace basePath', () => {
    expect(routeFor('/my-workspace/structure/author;knut', '/my-workspace')).toBe(
      'structure:document',
    )
  })

  it('never includes a document id, slug, or raw query string in the result', () => {
    expect(routeFor('/structure/author;very-specific-document-id-123?foo=bar')).toBe(
      'structure:document',
    )
  })
})
