/**
 * Dialogs render their content into the hosting pane's portal — outside the pane's DOM
 * subtree — and shadow the ambient `BoundaryElementProvider` with their own scroll box (#12721).
 * Popovers that may escape the dialog (reference results, the array insert menu) must still
 * resolve to the pane's declared portal boundary from inside every dialog implementation.
 *
 * A DOM containment test between pane and input fails this by construction, which is how
 * #14661 / #14726 happened, so these tests mount the real wrappers under a pane-shaped surface
 * and let them portal for real.
 */
import {BoundaryElementProvider, PortalProvider} from '@sanity/ui'
import {render, waitFor} from '@testing-library/react'
import {type ReactNode, useLayoutEffect, useMemo, useState} from 'react'
import {beforeEach, describe, expect, test, vi} from 'vitest'

import {createTestProvider} from '../../../../test/testUtils/TestProvider'
import {PortalBoundaryProvider} from '../../components/portalBoundary/PortalBoundaryProvider'
import {usePortalBoundary} from '../../components/portalBoundary/usePortalBoundary'
import {useReferenceAutocompletePopoverBoundary} from '../hooks/useReferenceAutocompletePopoverBoundary'
import {DefaultEditDialog} from '../inputs/PortableText/object/modals/DialogModal'
import {PopoverEditDialog} from '../inputs/PortableText/object/modals/PopoverModal'
import {EditPortal} from './EditPortal'
import {EnhancedObjectDialog} from './EnhancedObjectDialog'

vi.mock('../../hooks/useDialogStack', () => ({
  useDialogStack: () => ({
    dialogId: 'dialog-1',
    topEntry: {id: 'dialog-1', path: ['arr']},
    stack: [{id: 'dialog-1', path: ['arr']}],
    isTop: true,
    close: vi.fn(),
    navigateTo: vi.fn(),
  }),
}))

vi.mock('../useFormBuilder', () => ({
  useFormBuilder: () => ({__internal: {inspectOpen: false}}),
}))

// The breadcrumbs header needs the whole form context; the dialog chrome is not under test.
vi.mock('./breadcrumbs/DialogBreadcrumbs', () => ({
  DialogBreadcrumbs: () => <div data-testid="breadcrumbs" />,
}))

vi.mock('../../presence/overlay/PresenceOverlay', async (importActual) => ({
  ...((await importActual()) as Record<string, unknown>),
  PresenceOverlay: ({children}: {children: ReactNode}) => <div>{children}</div>,
}))

interface Capture {
  boundary: HTMLElement | null
  portalBoundary: HTMLElement | null
  probe: HTMLElement
}

const capture: {current: Capture | null} = {current: null}

/** Stands in for a reference input (or insert menu) inside the dialog content. */
function Probe() {
  const [probe, setProbe] = useState<HTMLDivElement | null>(null)
  const boundary = useReferenceAutocompletePopoverBoundary(probe)
  const portalBoundary = usePortalBoundary()
  useLayoutEffect(() => {
    if (probe) capture.current = {boundary, portalBoundary, probe}
  }, [boundary, portalBoundary, probe])
  return <div ref={setProbe} data-testid="probe" />
}

const pane: {scroller: HTMLElement | null; portal: HTMLElement | null} = {
  scroller: null,
  portal: null,
}

/**
 * The document pane, reduced to what matters here: a scroll container that is both the ambient
 * boundary and the declared portal boundary, and a portal target rendered *beside* it (as in
 * `DocumentPanel`). `default` maps to that portal the way the PTE `Compositor` maps it.
 */
function Pane(props: {children: ReactNode}) {
  const [scroller, setScroller] = useState<HTMLDivElement | null>(null)
  const [portalElement, setPortalElement] = useState<HTMLDivElement | null>(null)
  const elements = useMemo(() => ({default: portalElement}), [portalElement])
  useLayoutEffect(() => {
    pane.scroller = scroller
    pane.portal = portalElement
  }, [scroller, portalElement])
  return (
    <div data-testid="pane">
      <PortalBoundaryProvider element={scroller} portalElement={portalElement}>
        <PortalProvider element={portalElement} __unstable_elements={elements}>
          <BoundaryElementProvider element={scroller}>
            <div data-testid="scroller" ref={setScroller}>
              {portalElement ? props.children : null}
            </div>
          </BoundaryElementProvider>
        </PortalProvider>
      </PortalBoundaryProvider>
      <div data-testid="portal" ref={setPortalElement} />
    </div>
  )
}

const noop = () => undefined

const wrappers: Record<string, (children: ReactNode, anchor: HTMLElement) => ReactNode> = {
  'PopoverEditDialog (PTE annotation / inline object popover)': (children, anchor) => (
    <PopoverEditDialog
      floatingBoundary={pane.scroller}
      referenceBoundary={pane.scroller}
      referenceElement={anchor}
      onClose={noop}
      title="Edit"
    >
      {children}
    </PopoverEditDialog>
  ),
  'DefaultEditDialog (PTE block object dialog)': (children) => (
    <DefaultEditDialog onClose={noop} title="Edit">
      {children}
    </DefaultEditDialog>
  ),
  'EditPortal dialog (array item)': (children) => (
    <EditPortal type="dialog" header="Edit" width={1}>
      {children}
    </EditPortal>
  ),
  'EditPortal popover (array item)': (children, anchor) => (
    <EditPortal
      type="popover"
      header="Edit"
      width={1}
      legacy_referenceElement={anchor}
      onClose={noop}
    >
      {children}
    </EditPortal>
  ),
  'EnhancedObjectDialog dialog (tree editing)': (children) => (
    <EnhancedObjectDialog type="dialog" header="Edit" width={1}>
      {children}
    </EnhancedObjectDialog>
  ),
  'EnhancedObjectDialog popover (tree editing)': (children, anchor) => (
    <EnhancedObjectDialog
      type="popover"
      header="Edit"
      width={1}
      legacy_referenceElement={anchor}
      onClose={noop}
    >
      {children}
    </EnhancedObjectDialog>
  ),
}

describe('dialogs keep the pane as boundary for popovers that escape them', () => {
  beforeEach(() => {
    capture.current = null
    pane.scroller = null
    pane.portal = null
  })

  for (const [name, renderWrapper] of Object.entries(wrappers)) {
    test(name, async () => {
      const wrapper = await createTestProvider()

      function Anchored() {
        const [anchor, setAnchor] = useState<HTMLDivElement | null>(null)
        return (
          <>
            <div ref={setAnchor} data-testid="anchor" />
            {anchor ? renderWrapper(<Probe />, anchor) : null}
          </>
        )
      }

      render(
        <Pane>
          <Anchored />
        </Pane>,
        {wrapper},
      )

      await waitFor(() => {
        expect(capture.current?.boundary).not.toBeNull()
        expect(capture.current?.boundary).toBe(pane.scroller)
      })
      expect(capture.current?.portalBoundary).toBe(pane.scroller)

      // The dialog really portaled out of the pane's DOM subtree — the case a containment test
      // between pane and input gets wrong.
      const probe = capture.current!.probe
      expect(pane.scroller!.contains(probe)).toBe(false)
      expect(pane.portal!.contains(probe)).toBe(true)
    })
  }
})
