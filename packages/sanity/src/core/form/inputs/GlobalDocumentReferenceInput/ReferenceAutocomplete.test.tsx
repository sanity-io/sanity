/**
 * Ensures reference autocomplete popovers pass explicit floating/reference boundaries so
 * portaled dialogs (and embeds without DocumentPanel) get correct Floating UI behavior.
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

  return {...mod, Autocomplete: AutocompleteStub as Autocomplete}
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

describe('ReferenceAutocomplete popover boundaries (portaled dialogs / embeds)', () => {
  beforeEach(() => {
    lastPopoverProps = null
  })

  test('global document reference: passes documentElement as floatingBoundary and referenceBoundary to Popover', async () => {
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

  test('cross-dataset reference: passes documentElement as floatingBoundary and referenceBoundary to Popover', async () => {
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

  test('same-dataset reference: passes documentElement as floatingBoundary and referenceBoundary to Popover', async () => {
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
