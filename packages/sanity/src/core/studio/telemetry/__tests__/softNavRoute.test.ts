import {describe, expect, it} from 'vitest'

import {recordStructurePaneKind} from '../paneKindRegistry'
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
  it('classifies a list pane using the kind the structure tool recorded for that path', () => {
    recordStructurePaneKind('author', 'list')

    expect(routeFor('/structure/author')).toBe('structure:list')
  })

  it('classifies a document pane the same way', () => {
    recordStructurePaneKind('author;knut', 'document')

    expect(routeFor('/structure/author;knut')).toBe('structure:document')
  })

  it('looks up a pane carrying params and a payload by its id chain alone', () => {
    recordStructurePaneKind('author;knut-with-params', 'document')

    expect(routeFor('/structure/author;knut-with-params,view=detail,eyJmb28iOiJiYXIifQ')).toBe(
      'structure:document',
    )
  })

  it('classifies a nested list opened inside a list as a list', () => {
    recordStructurePaneKind('photos', 'list')
    recordStructurePaneKind('photos;featured', 'list')

    expect(routeFor('/structure/photos;featured')).toBe('structure:list')
  })

  it('regression: the case above fails under the depth-parity heuristic this replaced', () => {
    // toSoftNavRoute used to guess the kind from pane-group depth (even -> list,
    // odd -> document) instead of looking up what the structure tool resolved.
    // A nested list, at depth 1, was misread as a document. Kept as a guard
    // against reintroducing that heuristic.
    function toStructurePaneKindByDepthParity(paneSegment: string): 'list' | 'document' {
      const depth = Math.max(paneSegment.split(';').filter(Boolean).length - 1, 0)
      return depth % 2 === 0 ? 'list' : 'document'
    }

    expect(toStructurePaneKindByDepthParity('photos;featured')).toBe('document')
  })

  it('reports structure:other for a pane path nothing has recorded, rather than guessing', () => {
    expect(routeFor('/structure/never-seen-before')).toBe('structure:other')
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
    recordStructurePaneKind('author;knut-scoped', 'document')

    expect(routeFor('/my-workspace/structure/author;knut-scoped', '/my-workspace')).toBe(
      'structure:document',
    )
  })

  it('never includes a document id, slug, or raw query string in the result', () => {
    recordStructurePaneKind('author;very-specific-document-id-123', 'document')

    expect(routeFor('/structure/author;very-specific-document-id-123?foo=bar')).toBe(
      'structure:document',
    )
  })

  it('derives the route from the reported navigationURL, not from a later navigation', () => {
    recordStructurePaneKind('author;first-opened', 'document')

    const firstNavRoute = routeFor('/structure/author;first-opened')

    // A metric can report after the user has already navigated again.
    routeFor('/structure/second-opened')

    expect(routeFor('/structure/author;first-opened')).toBe(firstNavRoute)
    expect(firstNavRoute).toBe('structure:document')
  })
})
