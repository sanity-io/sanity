import {generateHelpUrl} from '@sanity/generate-help-url'
import {lastValueFrom, of as observableOf} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {type StructureContext} from '../../structureBuilder/types'
import {type PaneNode} from '../../types'
import {createResolvedPaneNodeStream} from '../createResolvedPaneNodeStream'

const structureContext = {} as StructureContext

function createRootPane(child: PaneNode['child']): PaneNode {
  return {
    id: 'root',
    type: 'list',
    title: 'Root',
    child,
  }
}

describe('createResolvedPaneNodeStream missing child warning', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('warns without the stale help URL when a child is omitted', async () => {
    const resolvedPanes = await lastValueFrom(
      createResolvedPaneNodeStream({
        routerPanesStream: observableOf([[{id: 'item'}]]),
        rootPaneNode: createRootPane(undefined),
        structureContext,
      }),
    )

    expect(console.warn).toHaveBeenCalled()
    const [message] = vi.mocked(console.warn).mock.calls[0] ?? []
    expect(String(message)).toContain('Pane returned no child')
    expect(String(message)).not.toContain(generateHelpUrl('structure-item-returned-no-child'))
    expect(String(message)).not.toContain('structure-item-returned-no-child')
    expect(resolvedPanes.map((pane) => pane.routerPaneSibling.id)).toEqual(['root'])
  })
})
