/**
 * Ensures reference autocomplete popovers pick the correct Floating UI boundary so that:
 *
 *  - In the document pane (where `BoundaryElementProvider` wraps the scroll container) the
 *    popover is constrained to that scroll container. This prevents the popover from overlapping
 *    the sticky pane header, the version chips / document actions bar, or clipping into the pane
 *    top when flipped upward (SAPP-3726, SAPP-3728, SGH-588).
 *  - In portaled dialogs (e.g. the Media Library) where the reference element is not inside the
 *    inherited boundary element, we fall back to `document.documentElement` so the popover is
 *    positioned against the viewport (avoids `referenceHidden` / misalignment).
 *  - When the hosting surface declares a `PortalBoundaryProvider` (the document pane does, with
 *    its scroll container), that boundary wins regardless of where the input sits in the DOM.
 *    Dialogs and Portable Text object popovers are portaled, so a DOM containment test can
 *    never find the pane from inside them; the declared boundary lets results escape the dialog
 *    while still staying between the pane header and footer (#14661, #14726).
 *  - The declared boundary is tied to the surface's portal: an input that renders into a
 *    different `PortalProvider` (a custom input's body-level dialog) falls back to the rules above.
 *
 * `ReferenceInput/ReferenceAutocomplete` (same-dataset), GDR, and Cross-dataset
 * `CrossDatasetReferenceInput/ReferenceAutocomplete` share this Popover wiring. Same-dataset needs
 * `useFormBuilder` mocked with a `focusPath` that matches the `path` passed in props so the
 * component can mount.
 */
import {PortalProvider} from '@sanity/ui'
import {type Autocomplete, type AutocompleteProps} from '@sanity/ui/autocomplete'
import {render, waitFor} from '@testing-library/react'
import {type ReactNode, type Ref, useLayoutEffect, useRef, useState} from 'react'
import {describe, expect, test, vi, beforeEach} from 'vitest'

import {type PopoverProps as UIPopoverProps} from '../../../../ui-components/popover/Popover'
import {PortalBoundaryProvider} from '../../../components/portalBoundary/PortalBoundaryProvider'
import {ReferenceAutocomplete as CrossDatasetReferenceAutocomplete} from '../CrossDatasetReferenceInput/ReferenceAutocomplete'
import {ReferenceAutocomplete as SameDatasetReferenceAutocomplete} from '../ReferenceInput/ReferenceAutocomplete'
import {ReferenceAutocomplete} from './ReferenceAutocomplete'

type PopoverBoundaryCapture = Pick<UIPopoverProps, 'floatingBoundary' | 'referenceBoundary'>

/** Last props passed from ReferenceAutocomplete to Popover (via styled wrapper). */
let lastPopoverProps: PopoverBoundaryCapture | null = null

/** Element returned from the mocked `useBoundaryElement` hook (null = no provider). */
let mockBoundaryElement: HTMLElement | null = null

function assignForwardedRef<T>(ref: Ref<T> | undefined, value: T | null): void {
  if (typeof ref === 'function') {
    ref(value)
  } else if (ref) {
    ref.current = value
  }
}

const {sameDatasetFieldPath} = vi.hoisted(() => ({
  sameDatasetFieldPath: ['sameDatasetRefField'] as const,
}))

vi.mock('../../useFormBuilder', () => ({
  useFormBuilder: () => ({
    focusPath: [...sameDatasetFieldPath],
  }),
}))

vi.mock('@sanity/ui/autocomplete', async (importOriginal) => {
  const mod = (await importOriginal()) as Record<string, unknown>

  /**
   * Minimal Autocomplete that always invokes `renderPopover` so StyledPopover mounts (mirrors open search UI).
   */
  function AutocompleteStub(props: AutocompleteProps & {ref?: Ref<HTMLInputElement>}) {
    const {ref, renderPopover} = props
    const contentRef = useRef<HTMLDivElement>(null)
    const [popover, setPopover] = useState<ReactNode>(null)

    useLayoutEffect(() => {
      if (typeof renderPopover !== 'function') {
        // TODO(oxlint): remove this suppression in a follow-up when this test setup is refactored
        // oxlint-disable-next-line react/set-state-in-effect -- pre-existing violation, to be fixed in a follow-up
        setPopover(null)
        return
      }
      const input = document.createElement('input')
      setPopover(
        renderPopover(
          {
            content: null,
            hidden: false,
            inputElement: input,
            onMouseEnter: () => undefined,
            onMouseLeave: () => undefined,
          },
          contentRef,
        ),
      )
    }, [renderPopover])

    return (
      <div data-testid="autocomplete-stub">
        <input
          data-testid="autocomplete-input"
          ref={(node) => {
            assignForwardedRef(ref, node)
          }}
        />
        {popover}
      </div>
    )
  }

  // @ts-expect-error -- pre-existing, fix later
  return {...mod, Autocomplete: AutocompleteStub as Autocomplete}
})

// Mock `useBoundaryElement` so we can drive the hook under test without rendering a real
// `BoundaryElementProvider` (which would require importing from the mocked module and trips
// hoisting inside `importOriginal`).
vi.mock('@sanity/ui', async (importOriginal) => ({
  ...((await importOriginal()) as Record<string, unknown>),
  useBoundaryElement: () => ({version: 0.0, element: mockBoundaryElement}),
}))

vi.mock('../../../i18n/hooks/useTranslation', () => ({
  useTranslation: () => ({t: (key: string) => key}),
}))
vi.mock('../../../i18n/Translate', () => ({
  Translate: ({children}: {children?: ReactNode}) => <>{children}</>,
}))

vi.mock('../../../../ui-components/popover/Popover', async (importOriginal) => {
  const mod = (await importOriginal()) as Record<string, unknown>
  function PopoverCapture(props: UIPopoverProps & {ref?: Ref<HTMLDivElement>}) {
    const {ref} = props
    useLayoutEffect(() => {
      lastPopoverProps = {
        floatingBoundary: props.floatingBoundary,
        referenceBoundary: props.referenceBoundary,
      }
    }, [props.floatingBoundary, props.referenceBoundary])
    return <div ref={ref} data-testid="popover-capture" data-floating-ui-role="popover" />
  }
  return {...mod, Popover: PopoverCapture}
})

/**
 * Build a scroll-container stand-in, attach it to the DOM, and register it as the boundary
 * element that the mocked `useBoundaryElement` will return. Also builds a reference element that
 * is a descendant of that container so `boundary.contains(reference)` is `true`.
 */
function setupContainedBoundary(): {
  boundary: HTMLDivElement
  referenceElement: HTMLDivElement
} {
  const boundary = document.createElement('div')
  boundary.dataset.testid = 'scroll-boundary'
  const referenceElement = document.createElement('div')
  referenceElement.dataset.testid = 'reference-anchor'
  boundary.append(referenceElement)
  document.body.append(boundary)
  mockBoundaryElement = boundary
  return {boundary, referenceElement}
}

/**
 * Stand-in for a surface such as the document pane: a `PortalProvider` plus the boundary it
 * declares for content rendered through that portal.
 */
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

describe('ReferenceAutocomplete popover boundaries', () => {
  beforeEach(() => {
    lastPopoverProps = null
    mockBoundaryElement = null
  })

  describe('falls back to documentElement in portaled dialogs / embeds (no scroll-container ancestor)', () => {
    test('global document reference', async () => {
      render(
        <ReferenceAutocomplete
          loading={false}
          options={[]}
          onQueryChange={() => undefined}
          referenceElement={null}
          searchString=""
          id="ref-ac-test"
        />,
      )

      await waitFor(() => {
        expect(lastPopoverProps).not.toBeNull()
      })

      expect(lastPopoverProps?.floatingBoundary).toBe(document.documentElement)
      expect(lastPopoverProps?.referenceBoundary).toBe(document.documentElement)
    })

    test('cross-dataset reference', async () => {
      render(
        <CrossDatasetReferenceAutocomplete
          loading={false}
          options={[]}
          onQueryChange={() => undefined}
          referenceElement={null}
          searchString=""
          id="cross-ref-ac-test"
        />,
      )

      await waitFor(() => {
        expect(lastPopoverProps).not.toBeNull()
      })

      expect(lastPopoverProps?.floatingBoundary).toBe(document.documentElement)
      expect(lastPopoverProps?.referenceBoundary).toBe(document.documentElement)
    })

    test('same-dataset reference', async () => {
      render(
        <SameDatasetReferenceAutocomplete
          path={[...sameDatasetFieldPath]}
          loading={false}
          options={[]}
          onQueryChange={() => undefined}
          referenceElement={null}
          searchString=""
          id="same-dataset-ref-ac-test"
        />,
      )

      await waitFor(() => {
        expect(lastPopoverProps).not.toBeNull()
      })

      expect(lastPopoverProps?.floatingBoundary).toBe(document.documentElement)
      expect(lastPopoverProps?.referenceBoundary).toBe(document.documentElement)
    })
  })

  describe('uses the boundary element from context when it contains the reference (document pane scroll container)', () => {
    test('global document reference', async () => {
      const {boundary, referenceElement} = setupContainedBoundary()

      render(
        <ReferenceAutocomplete
          loading={false}
          options={[]}
          onQueryChange={() => undefined}
          referenceElement={referenceElement}
          searchString=""
          id="ref-ac-test-with-boundary"
        />,
      )

      await waitFor(() => {
        expect(lastPopoverProps?.floatingBoundary).toBe(boundary)
      })
      expect(lastPopoverProps?.referenceBoundary).toBe(boundary)
    })

    test('cross-dataset reference', async () => {
      const {boundary, referenceElement} = setupContainedBoundary()

      render(
        <CrossDatasetReferenceAutocomplete
          loading={false}
          options={[]}
          onQueryChange={() => undefined}
          referenceElement={referenceElement}
          searchString=""
          id="cross-ref-ac-test-with-boundary"
        />,
      )

      await waitFor(() => {
        expect(lastPopoverProps?.floatingBoundary).toBe(boundary)
      })
      expect(lastPopoverProps?.referenceBoundary).toBe(boundary)
    })

    test('same-dataset reference', async () => {
      const {boundary, referenceElement} = setupContainedBoundary()

      render(
        <SameDatasetReferenceAutocomplete
          path={[...sameDatasetFieldPath]}
          loading={false}
          options={[]}
          onQueryChange={() => undefined}
          referenceElement={referenceElement}
          searchString=""
          id="same-dataset-ref-ac-test-with-boundary"
        />,
      )

      await waitFor(() => {
        expect(lastPopoverProps?.floatingBoundary).toBe(boundary)
      })
      expect(lastPopoverProps?.referenceBoundary).toBe(boundary)
    })
  })

  describe('falls back to documentElement when context element does not contain the reference', () => {
    test('global document reference with boundary element but reference element outside it', async () => {
      // Attach a boundary to the mock, but leave the reference element elsewhere in the DOM.
      const boundary = document.createElement('div')
      document.body.append(boundary)
      mockBoundaryElement = boundary

      const detachedReference = document.createElement('div')
      document.body.append(detachedReference)

      render(
        <ReferenceAutocomplete
          loading={false}
          options={[]}
          onQueryChange={() => undefined}
          referenceElement={detachedReference}
          searchString=""
          id="ref-ac-test-detached"
        />,
      )

      await waitFor(() => {
        expect(lastPopoverProps).not.toBeNull()
      })

      expect(lastPopoverProps?.floatingBoundary).toBe(document.documentElement)
      expect(lastPopoverProps?.referenceBoundary).toBe(document.documentElement)
    })
  })

  describe('uses the declared portal boundary when the hosting surface provides one', () => {
    test('even when it does not contain the reference (portaled dialog / PTE popover)', async () => {
      // The ambient boundary is the dialog's own scroll box, which contains the input …
      const {referenceElement} = setupContainedBoundary()
      // … while the pane scroll container that declared the portal boundary does not.
      const paneBoundary = document.createElement('div')
      document.body.append(paneBoundary)

      render(
        <DeclaredPortal boundary={paneBoundary}>
          <SameDatasetReferenceAutocomplete
            path={[...sameDatasetFieldPath]}
            loading={false}
            options={[]}
            onQueryChange={() => undefined}
            referenceElement={referenceElement}
            searchString=""
            id="same-dataset-ref-ac-portal-boundary"
          />
        </DeclaredPortal>,
      )

      await waitFor(() => {
        expect(lastPopoverProps?.floatingBoundary).toBe(paneBoundary)
      })
      expect(lastPopoverProps?.referenceBoundary).toBe(paneBoundary)
    })

    test('cross-dataset reference', async () => {
      const {referenceElement} = setupContainedBoundary()
      const paneBoundary = document.createElement('div')
      document.body.append(paneBoundary)

      render(
        <DeclaredPortal boundary={paneBoundary}>
          <CrossDatasetReferenceAutocomplete
            loading={false}
            options={[]}
            onQueryChange={() => undefined}
            referenceElement={referenceElement}
            searchString=""
            id="cross-ref-ac-portal-boundary"
          />
        </DeclaredPortal>,
      )

      await waitFor(() => {
        expect(lastPopoverProps?.floatingBoundary).toBe(paneBoundary)
      })
      expect(lastPopoverProps?.referenceBoundary).toBe(paneBoundary)
    })

    test('global document reference', async () => {
      const {referenceElement} = setupContainedBoundary()
      const paneBoundary = document.createElement('div')
      document.body.append(paneBoundary)

      render(
        <DeclaredPortal boundary={paneBoundary}>
          <ReferenceAutocomplete
            loading={false}
            options={[]}
            onQueryChange={() => undefined}
            referenceElement={referenceElement}
            searchString=""
            id="ref-ac-portal-boundary"
          />
        </DeclaredPortal>,
      )

      await waitFor(() => {
        expect(lastPopoverProps?.floatingBoundary).toBe(paneBoundary)
      })
      expect(lastPopoverProps?.referenceBoundary).toBe(paneBoundary)
    })

    test('is ignored when the input renders into a different portal (custom body-level dialog)', async () => {
      // A custom input provides its own body-level portal for a dialog that holds the reference
      // field. The dialog is centered over the whole studio, so the pane's rect would hide it.
      const paneBoundary = document.createElement('div')
      document.body.append(paneBoundary)
      mockBoundaryElement = paneBoundary
      const detachedReference = document.createElement('div')
      document.body.append(detachedReference)
      const customPortal = document.body.appendChild(document.createElement('div'))

      render(
        <DeclaredPortal boundary={paneBoundary}>
          <PortalProvider element={customPortal}>
            <SameDatasetReferenceAutocomplete
              path={[...sameDatasetFieldPath]}
              loading={false}
              options={[]}
              onQueryChange={() => undefined}
              referenceElement={detachedReference}
              searchString=""
              id="same-dataset-ref-ac-foreign-portal"
            />
          </PortalProvider>
        </DeclaredPortal>,
      )

      await waitFor(() => {
        expect(lastPopoverProps).not.toBeNull()
      })
      expect(lastPopoverProps?.floatingBoundary).toBe(document.documentElement)
      expect(lastPopoverProps?.referenceBoundary).toBe(document.documentElement)
    })

    test('falls back to the ambient rules when the provider has no element yet', async () => {
      const {boundary, referenceElement} = setupContainedBoundary()

      render(
        <DeclaredPortal boundary={null}>
          <SameDatasetReferenceAutocomplete
            path={[...sameDatasetFieldPath]}
            loading={false}
            options={[]}
            onQueryChange={() => undefined}
            referenceElement={referenceElement}
            searchString=""
            id="same-dataset-ref-ac-portal-boundary-null"
          />
        </DeclaredPortal>,
      )

      await waitFor(() => {
        expect(lastPopoverProps?.floatingBoundary).toBe(boundary)
      })
      expect(lastPopoverProps?.referenceBoundary).toBe(boundary)
    })
  })
})
