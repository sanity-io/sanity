import {configure} from '@chromatic-com/vitest'
import {DndContext} from '@dnd-kit/core'
import {SortableContext} from '@dnd-kit/sortable'
import {ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {SortableItemIdContext} from 'sanity/_singletons'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {DragHandle} from './DragHandle'

// The tests assert `touch-action`, which a snapshot of the handle cannot show
configure({disableAutoSnapshot: true})

const theme = buildTheme()

function renderDragHandle(readOnly: boolean) {
  const id = 'item-1'
  return render(
    <ThemeProvider theme={theme}>
      <DndContext>
        <SortableContext items={[id]}>
          <SortableItemIdContext.Provider value={id}>
            <DragHandle readOnly={readOnly} />
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
  it('renders with touch-action: none so PointerSensor can receive touch input', async () => {
    await renderDragHandle(false)
    await expect.element(page.getByRole('button')).toHaveStyle({touchAction: 'none'})
  })

  it('keeps touch-action: auto when readOnly', async () => {
    // The handle is non-interactive when readOnly, so native scrolling should
    // remain enabled when a touch gesture starts on the handle area.
    await renderDragHandle(true)
    await expect.element(page.getByRole('button')).toHaveStyle({touchAction: 'auto'})
  })
})
