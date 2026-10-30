import {describe, expect, it} from 'vitest'

import {recordStructurePaneKind, recordStructureTool} from '../paneKindRegistry'
import {toSoftNavRoute, toToolPathSegments} from '../softNavRoute'

const STUDIO_ORIGIN = 'https://my-studio.sanity.studio'
const TOOL_NAMES = ['structure', 'cars', 'vision', 'media-library', 'presentation']

recordStructureTool('structure')
recordStructureTool('cars')

function routeFor(path: string, basePath = '/'): string {
  return toSoftNavRoute({
    navigationURL: `${STUDIO_ORIGIN}${path}`,
    basePath,
    toolNames: TOOL_NAMES,
  })
}

describe('toSoftNavRoute', () => {
  it('classifies a list pane using the kind the structure tool recorded for that path', () => {
    recordStructurePaneKind('structure', 'root;author', 'list')

    expect(routeFor('/structure/author')).toBe('structure:list')
  })

  it('classifies a document pane the same way', () => {
    recordStructurePaneKind('structure', 'root;author;knut', 'document')

    expect(routeFor('/structure/author;knut')).toBe('structure:document')
  })

  it('looks up a pane carrying params by its id chain alone, decoding the group the router encodes', () => {
    recordStructurePaneKind('structure', 'root;book;book-a', 'document')

    const encodedGroup = encodeURIComponent('book-a,inspect=sanity%2Fstructure%2Fvalidation')
    expect(routeFor(`/structure/book;${encodedGroup}`)).toBe('structure:document')
  })

  it('looks up a split-pane group by its first sibling, decoding the group the router encodes', () => {
    recordStructurePaneKind('structure', 'root;book;book-a', 'list')

    const encodedGroup = encodeURIComponent('book-a|,')
    expect(routeFor(`/structure/book;${encodedGroup}`)).toBe('structure:list')
  })

  it('classifies a nested list opened inside a list as a list', () => {
    recordStructurePaneKind('structure', 'root;photos', 'list')
    recordStructurePaneKind('structure', 'root;photos;featured', 'list')

    expect(routeFor('/structure/photos;featured')).toBe('structure:list')
  })

  it('classifies panes the same way for a renamed structure tool, with no collision against another tool', () => {
    recordStructurePaneKind('cars', 'root;book;renamed-tool-knut', 'document')
    recordStructurePaneKind('structure', 'root;book;renamed-tool-knut', 'list')

    expect(routeFor('/cars/book;renamed-tool-knut')).toBe('structure:document')
    expect(routeFor('/structure/book;renamed-tool-knut')).toBe('structure:list')
  })

  it('reports structure:other for a pane path nothing has recorded, rather than guessing', () => {
    expect(routeFor('/structure/never-seen-before')).toBe('structure:other')
  })

  it('reports structure:other for a group with a malformed percent-encoding', () => {
    expect(routeFor('/structure/author;%E0%A4%A')).toBe('structure:other')
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

  it('classifies a tool-scoped intent route the same way, e.g. global search landing in structure', () => {
    expect(routeFor('/structure/intent/edit/id=abc33;type=article')).toBe('intent:edit')
  })

  it('records through a root-prefixed resolver path and looks up from the real URL it maps to', () => {
    recordStructurePaneKind('structure', 'root;book;knut', 'document')

    expect(routeFor('/structure/book;knut')).toBe('structure:document')
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
    recordStructurePaneKind('structure', 'root;author;knut-scoped', 'document')

    expect(routeFor('/my-workspace/structure/author;knut-scoped', '/my-workspace')).toBe(
      'structure:document',
    )
  })

  it('never includes a document id, slug, or raw query string in the result', () => {
    recordStructurePaneKind('structure', 'root;author;very-specific-document-id-123', 'document')

    expect(routeFor('/structure/author;very-specific-document-id-123?foo=bar')).toBe(
      'structure:document',
    )
  })

  it('derives the route from the reported navigationURL, not from a later navigation', () => {
    recordStructurePaneKind('structure', 'root;author;first-opened', 'document')

    const firstNavRoute = routeFor('/structure/author;first-opened')

    // A metric can report after the user has already navigated again.
    routeFor('/structure/second-opened')

    expect(routeFor('/structure/author;first-opened')).toBe(firstNavRoute)
    expect(firstNavRoute).toBe('structure:document')
  })
})

describe('toToolPathSegments', () => {
  it('returns the path segments after the workspace basePath', () => {
    expect(toToolPathSegments(`${STUDIO_ORIGIN}/structure/author;knut`, '/')).toEqual([
      'structure',
      'author;knut',
    ])
  })

  it('returns an empty array for a URL outside the workspace basePath', () => {
    expect(
      toToolPathSegments(`${STUDIO_ORIGIN}/other-workspace/structure`, '/my-workspace'),
    ).toEqual([])
  })

  it('returns an empty array for an unparseable URL', () => {
    expect(toToolPathSegments('not-a-url', '/')).toEqual([])
  })
})
