import {DndContext} from '@dnd-kit/core'
import {SortableContext} from '@dnd-kit/sortable'
import {studioTheme, ThemeProvider} from '@sanity/ui'
import {render, screen} from '@testing-library/react'
import {type ReactNode, type RefObject, useEffect} from 'react'
import {describe, expect, it, vi} from 'vitest'

import {Item} from './list'
import {useArrayItemRootElementRef} from './useArrayItemRootElementRef'

type ObservedRef = RefObject<HTMLDivElement | null> | null

function Probe({onRootRef}: {onRootRef: (ref: ObservedRef) => void}) {
  const rootElementRef = useArrayItemRootElementRef()
  useEffect(() => {
    onRootRef(rootElementRef)
  }, [onRootRef, rootElementRef])
  return <div data-testid="probe" />
}

function renderWithTheme(children: ReactNode) {
  return render(<ThemeProvider theme={studioTheme}>{children}</ThemeProvider>)
}

describe('Item', () => {
  it('provides its root element to descendants when not sortable', () => {
    const onRootRef = vi.fn<(ref: ObservedRef) => void>()
    renderWithTheme(
      <Item id="item-1" sortable={false}>
        <Probe onRootRef={onRootRef} />
      </Item>,
    )

    const probe = screen.getByTestId('probe')
    const observedRootRef = onRootRef.mock.lastCall?.[0]
    expect(observedRootRef?.current).toBeInstanceOf(HTMLElement)
    expect(observedRootRef?.current?.contains(probe)).toBe(true)
  })

  it('provides its root element to descendants when sortable', () => {
    const onRootRef = vi.fn<(ref: ObservedRef) => void>()
    renderWithTheme(
      <DndContext>
        <SortableContext items={['item-1']}>
          <Item id="item-1" sortable>
            <Probe onRootRef={onRootRef} />
          </Item>
        </SortableContext>
      </DndContext>,
    )

    const probe = screen.getByTestId('probe')
    const observedRootRef = onRootRef.mock.lastCall?.[0]
    expect(observedRootRef?.current).toBeInstanceOf(HTMLElement)
    expect(observedRootRef?.current?.contains(probe)).toBe(true)
  })

  it('still forwards its ref to the caller', () => {
    const forwardedRef = vi.fn()
    renderWithTheme(
      <Item id="item-1" sortable={false} ref={forwardedRef}>
        <Probe onRootRef={vi.fn()} />
      </Item>,
    )

    expect(forwardedRef).toHaveBeenCalledWith(expect.any(HTMLElement))
  })

  it('does not provide a root element outside of an array item', () => {
    const onRootRef = vi.fn<(ref: ObservedRef) => void>()
    renderWithTheme(<Probe onRootRef={onRootRef} />)

    expect(onRootRef).toHaveBeenCalledWith(null)
  })
})
