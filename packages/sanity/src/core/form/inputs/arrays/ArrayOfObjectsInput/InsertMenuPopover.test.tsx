/**
 * Ensures the array insert menu popover picks the correct Floating UI boundary.
 *
 * Edit dialogs (`EditPortal`, `EnhancedObjectDialog`, PTE object modals) constrain their
 * descendant popovers to the dialog's scroll container via a generic `BoundaryElementProvider`
 * (#12721). The insert menu is deliberately allowed to overflow the dialog: inside a dialog it
 * uses the boundary captured by `EditDialogOuterBoundaryProvider` (typically the document pane's
 * scroll container, so the menu stays below the sticky pane header), and outside a dialog it
 * keeps using the ambient boundary.
 */
import {BoundaryElementProvider} from '@sanity/ui'
import {render, waitFor} from '@testing-library/react'
import {forwardRef, useLayoutEffect} from 'react'
import {EditDialogOuterBoundaryContext} from 'sanity/_singletons'
import {beforeEach, describe, expect, test, vi} from 'vitest'

import type * as UIComponentsModule from '../../../../../ui-components'
import {EditDialogOuterBoundaryProvider} from '../../../components/EditDialogOuterBoundaryProvider'
import {useInsertMenuPopover} from './InsertMenuPopover'

type PopoverBoundaryCapture = Pick<UIComponentsModule.PopoverProps, 'floatingBoundary'>

/** Last props passed from the insert menu popover to Popover. */
let lastPopoverProps: PopoverBoundaryCapture | null = null

vi.mock('../../../../i18n/hooks/useTranslation', () => ({
  useTranslation: () => ({t: (key: string) => key}),
}))

vi.mock('../../../../../ui-components', async (importOriginal) => {
  const mod = (await importOriginal()) as UIComponentsModule
  const Forward = forwardRef<HTMLDivElement, UIComponentsModule.PopoverProps>(
    function PopoverCapture(props, ref) {
      useLayoutEffect(() => {
        lastPopoverProps = {floatingBoundary: props.floatingBoundary}
      }, [props.floatingBoundary])
      return <div ref={ref} data-testid="popover-capture" />
    },
  )
  return {...mod, Popover: Forward as UIComponentsModule.Popover}
})

function Harness() {
  const {popover} = useInsertMenuPopover({
    insertMenuProps: {schemaTypes: [], onSelect: () => undefined},
    popoverProps: {},
  })
  return popover
}

describe('useInsertMenuPopover floating boundary', () => {
  beforeEach(() => {
    lastPopoverProps = null
  })

  test('uses the ambient boundary outside edit dialogs', async () => {
    render(<Harness />)

    await waitFor(() => {
      expect(lastPopoverProps).not.toBeNull()
    })
    expect(lastPopoverProps?.floatingBoundary).toBeUndefined()
  })

  test('uses the boundary outside the edit dialog when inside one', async () => {
    const outerBoundary = document.createElement('div')

    render(
      <EditDialogOuterBoundaryContext.Provider value={{element: outerBoundary}}>
        <Harness />
      </EditDialogOuterBoundaryContext.Provider>,
    )

    await waitFor(() => {
      expect(lastPopoverProps?.floatingBoundary).toBe(outerBoundary)
    })
  })

  test('falls back to the document root inside an edit dialog without an ambient boundary', async () => {
    render(
      <EditDialogOuterBoundaryContext.Provider value={{element: null}}>
        <Harness />
      </EditDialogOuterBoundaryContext.Provider>,
    )

    await waitFor(() => {
      expect(lastPopoverProps?.floatingBoundary).toBe(document.documentElement)
    })
  })

  test('stacked edit dialogs inherit the outermost captured boundary', async () => {
    const paneBoundary = document.createElement('div')
    const outerDialogBoundary = document.createElement('div')
    const nestedDialogBoundary = document.createElement('div')

    render(
      <BoundaryElementProvider element={paneBoundary}>
        {/* Outermost edit dialog captures the pane boundary … */}
        <EditDialogOuterBoundaryProvider>
          <BoundaryElementProvider element={outerDialogBoundary}>
            {/* … and a nested edit dialog inherits it instead of capturing the parent dialog. */}
            <EditDialogOuterBoundaryProvider>
              <BoundaryElementProvider element={nestedDialogBoundary}>
                <Harness />
              </BoundaryElementProvider>
            </EditDialogOuterBoundaryProvider>
          </BoundaryElementProvider>
        </EditDialogOuterBoundaryProvider>
      </BoundaryElementProvider>,
    )

    await waitFor(() => {
      expect(lastPopoverProps?.floatingBoundary).toBe(paneBoundary)
    })
  })
})
