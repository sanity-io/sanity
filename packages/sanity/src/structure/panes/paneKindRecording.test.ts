import {toSoftNavRoute} from 'sanity/_dangerously_use_private_internals_that_do_not_follow_semver'
import {describe, expect, it} from 'vitest'

import {recordResolvedPaneKind} from './paneKindRecording'

const STUDIO_ORIGIN = 'https://my-studio.sanity.studio'
const TOOL_NAMES = ['structure']

function routeFor(path: string): string {
  return toSoftNavRoute({
    navigationURL: `${STUDIO_ORIGIN}${path}`,
    basePath: '/',
    toolNames: TOOL_NAMES,
  })
}

describe('recordResolvedPaneKind', () => {
  it('records a document under the path a real browser URL carries, root id stripped', () => {
    recordResolvedPaneKind('root;book;knut', 'document')

    expect(routeFor('/structure/book;knut')).toBe('structure:document')
  })

  it('records a top-level list the same way, root id stripped', () => {
    recordResolvedPaneKind('root;book', 'list')

    expect(routeFor('/structure/book')).toBe('structure:list')
  })
})
