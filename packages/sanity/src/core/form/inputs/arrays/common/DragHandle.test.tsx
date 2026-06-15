import {DndContext} from '@dnd-kit/core'
import {SortableContext} from '@dnd-kit/sortable'
import {studioTheme, ThemeProvider} from '@sanity/ui'
import {render, screen} from '@testing-library/react'
import {SortableItemIdContext} from 'sanity/_singletons'
import {describe, expect, it, vi} from 'vitest'

import {DragHandle} from './DragHandle'

vi.mock('../../../../i18n', () => ({
  useTranslation: () => ({t: (key: string) => key}),
}))

function renderDragHandle(props: Partial<React.ComponentProps<typeof DragHandle>> = {}) {
  const id = 'item-1'
  return render(
    <ThemeProvider theme={studioTheme}>
      <DndContext>
        <SortableContext items={[id]}>
          <SortableItemIdContext.Provider value={id}>
            <DragHandle readOnly={false} {...props} />
          </SortableItemIdContext.Provider>
        </SortableContext>
      </DndContext>
    </ThemeProvider>,
  )
}

describe('DragHandle', () => {
  // Regression for https://github.com/sanity-io/sanity/issues/12931
  //
  // @dnd-kit's PointerSensor (configured in ./list.tsx) relies on native
  // pointer events. On touch devices, the browser's default touch action
  // (scrolling) wins over the sensor unless the draggable element opts out
  // via 'touch-action: none'. Without it, pressing the drag handle on mobile
  // scrolls the page instead of starting the drag, and array items can't be
  // reordered.
  //
  // dnd-kit docs:
  // https://docs.dndkit.com/api-documentation/sensors/pointer#recommendations
  it('renders with touch-action: none so PointerSensor can receive touch input', () => {
    renderDragHandle()
    expect(screen.getByRole('button')).toHaveStyle('touch-action: none')
  })

  it('keeps touch-action: auto when readOnly', () => {
    // The handle is non-interactive when readOnly, so native scrolling should
    // remain enabled when a touch gesture starts on the handle area.
    renderDragHandle({readOnly: true})
    expect(screen.getByRole('button')).toHaveStyle('touch-action: auto')
  })
})
