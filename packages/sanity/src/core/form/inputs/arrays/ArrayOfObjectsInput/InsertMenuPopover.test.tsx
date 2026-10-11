/**
 * Ensures the array insert menu popover picks the correct Floating UI boundary.
 *
 * Dialogs (`EditPortal`, `EnhancedObjectDialog`, PTE object modals) constrain their
 * descendant popovers to the dialog's scroll container via a generic `BoundaryElementProvider`
 * (#12721). The insert menu is deliberately allowed to overflow the dialog: when the hosting
 * surface declares a `PortalBoundaryProvider` (the document pane does, with its scroll container)
 * the menu uses that, so it stays below the sticky pane header no matter how deeply it is nested
 * in dialogs. Without a declared portal boundary, or when the menu renders into a different
 * portal than the one the boundary was declared for, it keeps using the ambient boundary.
 */
import {BoundaryElementProvider, PortalProvider} from '@sanity/ui'
import {render, waitFor} from '@testing-library/react'
import {type ReactNode, type RefAttributes, useLayoutEffect, useState} from 'react'
import {beforeEach, describe, expect, test, vi} from 'vitest'

import {type PopoverProps as UIPopoverProps} from '../../../../../ui-components/popover/Popover'
import {PortalBoundaryProvider} from '../../../../components/portalBoundary/PortalBoundaryProvider'
import {useInsertMenuPopover} from './InsertMenuPopover'

type PopoverBoundaryCapture = Pick<UIPopoverProps, 'floatingBoundary'>

/** Last props passed from the insert menu popover to Popover. */
let lastPopoverProps: PopoverBoundaryCapture | null = null

vi.mock('../../../../i18n/hooks/useTranslation', () => ({
  useTranslation: () => ({t: (key: string) => key}),
}))

vi.mock('../../../../../ui-components/popover/Popover', async (importOriginal) => {
  const mod = (await importOriginal()) as Record<string, unknown>
  function PopoverCapture(props: UIPopoverProps & RefAttributes<HTMLDivElement>) {
    const {ref, floatingBoundary} = props
    useLayoutEffect(() => {
      lastPopoverProps = {floatingBoundary}
    }, [floatingBoundary])
    return <div ref={ref} data-testid="popover-capture" />
  }
  return {...mod, Popover: PopoverCapture}
})

function Harness() {
  const {popover} = useInsertMenuPopover({
    insertMenuProps: {schemaTypes: [], onSelect: () => undefined},
    popoverProps: {},
  })
  return popover
}

/** Stand-in for the document pane: a `PortalProvider` plus the boundary it declares for it. */
function DeclaredPortal(props: {boundary: HTMLElement | null; children: ReactNode}) {
  const [portalElement] = useState(() => document.body.appendChild(document.createElement('div')))
  return (
    <PortalProvider element={portalElement}>
      <PortalBoundaryProvider element={props.boundary} portalElement={portalElement}>
        {props.children}
      </PortalBoundaryProvider>
    </PortalProvider>
  )
}

describe('useInsertMenuPopover floating boundary', () => {
  beforeEach(() => {
    lastPopoverProps = null
  })

  test('uses the ambient boundary when no portal boundary is declared', async () => {
    render(<Harness />)

    await waitFor(() => {
      expect(lastPopoverProps).not.toBeNull()
    })
    expect(lastPopoverProps?.floatingBoundary).toBeUndefined()
  })

  test('uses the ambient boundary when the declared portal boundary has no element yet', async () => {
    render(
      <DeclaredPortal boundary={null}>
        <Harness />
      </DeclaredPortal>,
    )

    await waitFor(() => {
      expect(lastPopoverProps).not.toBeNull()
    })
    expect(lastPopoverProps?.floatingBoundary).toBeUndefined()
  })

  test('uses the declared portal boundary', async () => {
    const paneBoundary = document.createElement('div')

    render(
      <DeclaredPortal boundary={paneBoundary}>
        <Harness />
      </DeclaredPortal>,
    )

    await waitFor(() => {
      expect(lastPopoverProps?.floatingBoundary).toBe(paneBoundary)
    })
  })

  test('ignores the declared portal boundary when rendering into a different portal', async () => {
    const paneBoundary = document.createElement('div')
    const customPortal = document.body.appendChild(document.createElement('div'))

    render(
      <DeclaredPortal boundary={paneBoundary}>
        <PortalProvider element={customPortal}>
          <Harness />
        </PortalProvider>
      </DeclaredPortal>,
    )

    await waitFor(() => {
      expect(lastPopoverProps).not.toBeNull()
    })
    expect(lastPopoverProps?.floatingBoundary).toBeUndefined()
  })

  test('dialog scroll boxes do not shadow the declared portal boundary, however deeply nested', async () => {
    const paneBoundary = document.createElement('div')
    const outerDialogBoundary = document.createElement('div')
    const nestedDialogBoundary = document.createElement('div')

    render(
      <DeclaredPortal boundary={paneBoundary}>
        <BoundaryElementProvider element={paneBoundary}>
          <BoundaryElementProvider element={outerDialogBoundary}>
            <BoundaryElementProvider element={nestedDialogBoundary}>
              <Harness />
            </BoundaryElementProvider>
          </BoundaryElementProvider>
        </BoundaryElementProvider>
      </DeclaredPortal>,
    )

    await waitFor(() => {
      expect(lastPopoverProps?.floatingBoundary).toBe(paneBoundary)
    })
  })
})
