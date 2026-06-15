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
 *
 * `ReferenceInput/ReferenceAutocomplete` (same-dataset), GDR, and Cross-dataset
 * `CrossDatasetReferenceInput/ReferenceAutocomplete` share this Popover wiring. Same-dataset needs
 * `useFormBuilder` mocked with a `focusPath` that matches the `path` passed in props so the
 * component can mount.
 */
import {type Autocomplete, type AutocompleteProps} from '@sanity/ui'
import {render, waitFor} from '@testing-library/react'
import {
  type ForwardedRef,
  forwardRef,
  type ReactNode,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import {describe, expect, test, vi, beforeEach} from 'vitest'

import type * as UIComponentsModule from '../../../../ui-components'
import {ReferenceAutocomplete as CrossDatasetReferenceAutocomplete} from '../CrossDatasetReferenceInput/ReferenceAutocomplete'
import {ReferenceAutocomplete as SameDatasetReferenceAutocomplete} from '../ReferenceInput/ReferenceAutocomplete'
import {ReferenceAutocomplete} from './ReferenceAutocomplete'

type PopoverBoundaryCapture = Pick<
  UIComponentsModule.PopoverProps,
  'floatingBoundary' | 'referenceBoundary'
>

/** Last props passed from ReferenceAutocomplete to Popover (via styled wrapper). */
let lastPopoverProps: PopoverBoundaryCapture | null = null

/** Element returned from the mocked `useBoundaryElement` hook (null = no provider). */
let mockBoundaryElement: HTMLElement | null = null

function assignForwardedRef<T>(ref: ForwardedRef<T>, value: T | null): void {
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

vi.mock('@sanity/ui', async (importOriginal) => {
  const mod = (await importOriginal()) as Record<string, unknown>

  /**
   * Minimal Autocomplete that always invokes `renderPopover` so StyledPopover mounts (mirrors open search UI).
   */
  const AutocompleteStub = forwardRef(function AutocompleteStub(
    props: AutocompleteProps,
    ref: ForwardedRef<HTMLInputElement>,
  ) {
    const {renderPopover} = props
    const contentRef = useRef<HTMLDivElement>(null)
    const [popover, setPopover] = useState<ReactNode>(null)

    useLayoutEffect(() => {
      if (typeof renderPopover !== 'function') {
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
  })

  // Mock `useBoundaryElement` so we can drive the hook under test without rendering a real
  // `BoundaryElementProvider` (which would require importing from the mocked module and trips
  // hoisting inside `importOriginal`).
  const useBoundaryElement = () => ({version: 0.0, element: mockBoundaryElement})

  return {...mod, Autocomplete: AutocompleteStub as Autocomplete, useBoundaryElement}
})

vi.mock('../../../i18n', () => ({
  useTranslation: () => ({t: (key: string) => key}),
  Translate: ({children}: {children?: ReactNode}) => <>{children}</>,
}))

vi.mock('../../../../ui-components', async (importOriginal) => {
  const mod = (await importOriginal()) as UIComponentsModule
  const Forward = forwardRef<HTMLDivElement, UIComponentsModule.PopoverProps>(
    function PopoverCapture(props, ref) {
      useLayoutEffect(() => {
        lastPopoverProps = {
          floatingBoundary: props.floatingBoundary,
          referenceBoundary: props.referenceBoundary,
        }
      }, [props.floatingBoundary, props.referenceBoundary])
      return <div ref={ref} data-testid="popover-capture" data-floating-ui-role="popover" />
    },
  )
  return {...mod, Popover: Forward as UIComponentsModule.Popover}
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
})
