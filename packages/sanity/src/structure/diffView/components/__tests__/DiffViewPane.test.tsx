import {render, screen, waitFor} from '@testing-library/react'
import {useLayoutEffect} from 'react'
import {describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {type PathSyncChannel} from '../../types/pathSyncChannel'
import {DiffViewPane} from '../DiffViewPane'

const portalBoundaryCapture = vi.hoisted(() => ({current: null as HTMLElement | null}))

// Replace the document layout (and with it the whole form) with a probe that reads the boundary
// the pane declares for popovers rendered through its portal.
vi.mock('../../../../core/config/components/useMiddlewareComponents', async () => {
  const {usePortalBoundary} =
    await import('../../../../core/components/portalBoundary/usePortalBoundary')
  function Probe() {
    const boundary = usePortalBoundary()
    useLayoutEffect(() => {
      portalBoundaryCapture.current = boundary
    }, [boundary])
    return <div data-testid="diff-view-form" />
  }
  return {useMiddlewareComponents: () => Probe}
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
        syncChannel={{} as PathSyncChannel}
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
