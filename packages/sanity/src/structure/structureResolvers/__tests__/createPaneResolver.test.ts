import {generateHelpUrl} from '@sanity/generate-help-url'
import {lastValueFrom, of as observableOf} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {SerializeError} from '../../structureBuilder/SerializeError'
import {type StructureContext} from '../../structureBuilder/types'
import {type PaneNode} from '../../types'
import {createResolvedPaneNodeStream} from '../createResolvedPaneNodeStream'
import {PaneResolutionError} from '../PaneResolutionError'

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

describe('createResolvedPaneNodeStream async child errors', () => {
  it('wraps an error from an async child resolver in a PaneResolutionError', async () => {
    const childError = new SerializeError('Failed to resolve document', [], 'item')
    const resolution = lastValueFrom(
      createResolvedPaneNodeStream({
        routerPanesStream: observableOf([[{id: 'item'}]]),
        rootPaneNode: createRootPane(() => Promise.reject(childError)),
        structureContext,
      }),
    )

    await expect(resolution).rejects.toBeInstanceOf(PaneResolutionError)
    await expect(resolution).rejects.toMatchObject({cause: childError})
  })
})
