import {generateHelpUrl} from '@sanity/generate-help-url'
import {firstValueFrom, lastValueFrom, of as observableOf} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {type StructureContext} from '../../structureBuilder/types'
import {type PaneNode, type RouterPaneSiblingContext} from '../../types'
import {createPaneResolver} from '../createPaneResolver'
import {createResolvedPaneNodeStream} from '../createResolvedPaneNodeStream'
import {PaneResolutionError} from '../PaneResolutionError'

const structureContext = {} as StructureContext

const context: RouterPaneSiblingContext = {
  id: 'item',
  parent: null,
  index: 1,
  splitIndex: 0,
  path: ['root', 'item'],
  params: {},
  payload: undefined,
  structureContext,
}

function createRootPane(child: PaneNode['child']): PaneNode {
  return {
    id: 'root',
    type: 'list',
    title: 'Root',
    child,
  }
}

describe('createPaneResolver', () => {
  it('throws structure-item-returned-no-child when the pane is undefined', () => {
    const resolvePane = createPaneResolver((next) => next)

    expect(() => resolvePane(undefined, context, 0)).toThrow(PaneResolutionError)

    try {
      resolvePane(undefined, context, 0)
    } catch (error) {
      expect(error).toBeInstanceOf(PaneResolutionError)
      expect((error as PaneResolutionError).helpId).toBe('structure-item-returned-no-child')
    }
  })

  it('does not throw when the pane is an explicit null leaf', async () => {
    const resolvePane = createPaneResolver((next) => next)

    await expect(firstValueFrom(resolvePane(null, context, 0))).resolves.toBeNull()
  })

  it('throws structure-item-returned-no-child when a child resolver returns undefined', () => {
    const resolvePane = createPaneResolver((next) => next)

    expect(() => resolvePane(() => undefined, context, 0)).toThrow(PaneResolutionError)
  })

  it('does not throw when a child resolver returns null', async () => {
    const resolvePane = createPaneResolver((next) => next)

    await expect(firstValueFrom(resolvePane(() => null, context, 0))).resolves.toBeNull()
  })
})

describe('createResolvedPaneNodeStream child resolution', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {
      // suppress expected missing-child warnings
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('warns with the help URL when a child is omitted (undefined)', async () => {
    const resolvedPanes = await lastValueFrom(
      createResolvedPaneNodeStream({
        routerPanesStream: observableOf([[{id: 'item'}]]),
        rootPaneNode: createRootPane(undefined),
        structureContext,
      }),
    )

    expect(console.warn).toHaveBeenCalled()
    const [message] = vi.mocked(console.warn).mock.calls[0] ?? []
    expect(String(message)).toContain(generateHelpUrl('structure-item-returned-no-child'))
    expect(resolvedPanes.map((pane) => pane.routerPaneSibling.id)).toEqual(['root'])
  })

  it('resolves an explicit null child to no next pane without warning', async () => {
    const resolvedPanes = await lastValueFrom(
      createResolvedPaneNodeStream({
        routerPanesStream: observableOf([[{id: 'item'}]]),
        rootPaneNode: createRootPane(null),
        structureContext,
      }),
    )

    expect(console.warn).not.toHaveBeenCalled()
    expect(resolvedPanes.map((pane) => pane.routerPaneSibling.id)).toEqual(['root'])
  })

  it('resolves a child resolver that returns null to no next pane without warning', async () => {
    const resolvedPanes = await lastValueFrom(
      createResolvedPaneNodeStream({
        routerPanesStream: observableOf([[{id: 'item'}]]),
        rootPaneNode: createRootPane(() => null),
        structureContext,
      }),
    )

    expect(console.warn).not.toHaveBeenCalled()
    expect(resolvedPanes.map((pane) => pane.routerPaneSibling.id)).toEqual(['root'])
  })
})
