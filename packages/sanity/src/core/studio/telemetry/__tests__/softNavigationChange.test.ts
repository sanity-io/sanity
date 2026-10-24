import {describe, expect, it} from 'vitest'

import {describeChange} from '../softNavigationChange'

const ORIGIN = 'https://test-studio.sanity.dev'

function structureUrl(...paneGroups: string[]): string {
  return `${ORIGIN}/test/structure/${paneGroups.map(encodeURIComponent).join(';')}`
}

const INSPECT_VALIDATION = `inspect=${encodeURIComponent('sanity/structure/validation')}`

describe('describeChange', () => {
  it.each([
    {
      label: 'list to document',
      previousURL: structureUrl('book'),
      nextURL: structureUrl('book', 'book-a'),
      nextRoute: 'structure:document',
      change: 'document-open',
    },
    {
      label: 'document to sibling document',
      previousURL: structureUrl('book', 'book-a'),
      nextURL: structureUrl('book', 'book-b'),
      nextRoute: 'structure:document',
      change: 'document-open',
    },
    {
      label: 'split pane to the right',
      previousURL: structureUrl('book', 'book-a'),
      nextURL: structureUrl('book', 'book-a|,'),
      nextRoute: 'structure:document',
      change: 'document-open',
    },
    {
      label: 'search result through an intent link',
      previousURL: structureUrl('book'),
      nextURL: `${ORIGIN}/test/intent/edit/id=book-a;type=book`,
      nextRoute: 'intent:edit',
      change: 'document-open',
    },
    {
      label: 'global search result through a tool-scoped intent link',
      previousURL: `${ORIGIN}/test/vision`,
      nextURL: `${ORIGIN}/test/structure/intent/edit/id=book-a;type=book`,
      nextRoute: 'structure:other',
      change: 'document-open',
    },
    {
      label: 'sibling list that closes the deeper panes',
      previousURL: structureUrl('book', 'book-a'),
      nextURL: structureUrl('author'),
      nextRoute: 'structure:list',
      change: 'pane-open',
    },
    {
      label: 'root to list',
      previousURL: `${ORIGIN}/test/structure`,
      nextURL: structureUrl('book'),
      nextRoute: 'structure:list',
      change: 'pane-open',
    },
    {
      label: 'list to sibling list',
      previousURL: structureUrl('book'),
      nextURL: structureUrl('author'),
      nextRoute: 'structure:list',
      change: 'pane-open',
    },
    {
      label: 'document view tab',
      previousURL: structureUrl('book', 'book-a'),
      nextURL: structureUrl('book', 'book-a,view=variant-versions'),
      nextRoute: 'structure:document',
      change: 'view-change',
    },
    {
      label: 'inspector open',
      previousURL: structureUrl('book', 'book-a'),
      nextURL: structureUrl('book', `book-a,${INSPECT_VALIDATION}`),
      nextRoute: 'structure:document',
      change: 'inspector-toggle',
    },
    {
      label: 'inspector close',
      previousURL: structureUrl('book', `book-a,${INSPECT_VALIDATION}`),
      nextURL: structureUrl('book', 'book-a'),
      nextRoute: 'structure:document',
      change: 'inspector-toggle',
    },
    {
      label: 'review changes, which sets since and inspect together',
      previousURL: structureUrl('book', 'book-a'),
      nextURL: structureUrl(
        'book',
        `book-a,since=r1,inspect=${encodeURIComponent('sanity/structure/history')}`,
      ),
      nextRoute: 'structure:document',
      change: 'inspector-toggle',
    },
    {
      label: 'perspective switch',
      previousURL: structureUrl('book', 'book-a'),
      nextURL: `${structureUrl('book', 'book-a')}?perspective=rSummer`,
      nextRoute: 'structure:document',
      change: 'perspective-change',
    },
    {
      label: 'tool switch',
      previousURL: structureUrl('book'),
      nextURL: `${ORIGIN}/test/vision`,
      nextRoute: 'vision',
      change: 'tool-switch',
    },
    {
      label: 'releases overview filter',
      previousURL: `${ORIGIN}/test/releases`,
      nextURL: `${ORIGIN}/test/releases?${encodeURIComponent('releases[group]')}=archived`,
      nextRoute: 'releases',
      change: 'filter-change',
    },
    {
      label: 'pane close',
      previousURL: structureUrl('book', 'book-a'),
      nextURL: structureUrl('book'),
      nextRoute: 'structure:list',
      change: 'other',
    },
    {
      label: 'path change inside a tool without panes',
      previousURL: `${ORIGIN}/test/releases`,
      nextURL: `${ORIGIN}/test/releases/rSummer`,
      nextRoute: 'releases',
      change: 'other',
    },
    {
      label: 'an unparsable URL',
      previousURL: 'not a url',
      nextURL: structureUrl('book'),
      nextRoute: 'structure:list',
      change: 'other',
    },
  ])('classifies $label as $change', ({previousURL, nextURL, nextRoute, change}) => {
    expect(describeChange({previousURL, nextURL, nextRoute, basePath: '/test'})).toBe(change)
  })
})
