import {render, screen, waitFor} from '@testing-library/react'
import {useLayoutEffect} from 'react'
import {Subject} from 'rxjs'
import {describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {type PathSyncState} from '../../types/pathSyncChannel'
import {DiffViewPane} from '../DiffViewPane'
import {readOnlyPane} from '../DiffViewPane.css'

const portalBoundaryCapture = vi.hoisted(() => ({current: null as HTMLElement | null}))

// Replace the document layout (and with it the whole form) with a probe that reads the boundary
// the pane declares for popovers rendered through its portal.
vi.mock('sanity', async (importOriginal) => {
  const original = (await importOriginal()) as Record<string, unknown>
  const usePortalBoundary = original.usePortalBoundary as () => HTMLElement | null
  function Probe() {
    const boundary = usePortalBoundary()
    useLayoutEffect(() => {
      portalBoundaryCapture.current = boundary
    }, [boundary])
    return <div data-testid="diff-view-form" />
  }
  return {...original, useMiddlewareComponents: () => Probe}
})

describe('DiffViewPane portal boundary', () => {
  it('declares the pane as the boundary for popovers portaled into it', async () => {
    const wrapper = await createTestProvider()
    render(
      <DiffViewPane
        role="next"
        documentType="author"
        documentId="doc-1"
        scrollElement={null}
        syncChannel={new Subject<PathSyncState>()}
        compareDocument={{type: 'author', id: 'drafts.doc-1'}}
      />,
      {wrapper},
    )

    // The pane's portal target is a direct child of the pane layout that is also its boundary.
    const pane = screen.getByTestId('diffView-document-panel-portal').parentElement
    await waitFor(() => {
      expect(portalBoundaryCapture.current).toBe(pane)
    })
  })
})

describe('DiffViewPane with Variants off', () => {
  async function renderPane(variantsEnabled: boolean) {
    const wrapper = await createTestProvider({
      config: variantsEnabled ? {beta: {variants: {enabled: true}}} : undefined,
    })
    render(
      <DiffViewPane
        role="next"
        documentType="author"
        documentId="doc-1"
        scrollElement={null}
        syncChannel={new Subject<PathSyncState>()}
        compareDocument={{type: 'author', id: 'drafts.doc-1'}}
      />,
      {wrapper},
    )
    const pane = screen.getByTestId('diffView-document-panel-portal').parentElement
    return pane?.className.split(' ') ?? []
  }

  it("keeps main's pane, without the read-only styling", async () => {
    const classes = await renderPane(false)
    for (const className of readOnlyPane.split(' ')) {
      expect(classes).not.toContain(className)
    }
  })

  it('styles the pane read-only with Variants on', async () => {
    const classes = await renderPane(true)
    for (const className of readOnlyPane.split(' ')) {
      expect(classes).toContain(className)
    }
  })
})
