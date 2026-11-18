import {studioTheme, ThemeProvider} from '@sanity/ui'
import {render, screen} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {useState} from 'react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {DragHandle} from './DragHandle'
import {Item, List} from './list'

vi.mock('../../../../i18n/hooks/useTranslation', () => ({
  useTranslation: () => ({t: (key: string) => key}),
}))

const ITEMS = ['item-a', 'item-b', 'item-c']
const ROW_HEIGHT = 40
const ROW_GAP = 10

// jsdom has no layout, so give every row a distinct position for dnd-kit's collision detection
function mockRowRects() {
  return vi
    .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
    .mockImplementation(function getBoundingClientRect(this: HTMLElement) {
      const row = this.closest<HTMLElement>('[data-index]')
      // Anything outside a row (the list itself) spans all rows, so drags can stay inside it
      const top = row ? Number(row.dataset.index) * (ROW_HEIGHT + ROW_GAP) : 0
      const height = row ? ROW_HEIGHT : ITEMS.length * (ROW_HEIGHT + ROW_GAP)
      return {
        x: 0,
        y: top,
        top,
        left: 0,
        right: 300,
        bottom: top + height,
        width: 300,
        height,
        toJSON: () => ({}),
      }
    })
}

function SortableRows(props: {
  onItemMove: (event: {fromIndex: number; toIndex: number}) => void
  readOnly?: boolean
}) {
  const {onItemMove, readOnly = false} = props
  // Remounts the handles without remounting the items, as happens when an item's content swaps
  // between layouts (a reference item going from its edit state to its preview, for instance)
  const [handleGeneration, setHandleGeneration] = useState(0)

  return (
    // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
    <ThemeProvider theme={studioTheme}>
      <button type="button" onClick={() => setHandleGeneration((current) => current + 1)}>
        remount handles
      </button>
      <List axis="y" items={ITEMS} sortable onItemMove={onItemMove}>
        {ITEMS.map((id, index) => (
          <Item key={id} id={id} sortable data-index={index}>
            <div data-testid={`handle-${id}`}>
              <DragHandle key={handleGeneration} readOnly={readOnly} />
            </div>
          </Item>
        ))}
      </List>
    </ThemeProvider>
  )
}

function getHandle(id: string) {
  return screen.getByTestId(`handle-${id}`).querySelector('button')!
}

// dnd-kit's KeyboardSensor starts listening for keys on a timeout after the drag starts, which the
// default `delay: 0` between keys waits out
async function dragDownOneRow(handle: HTMLElement) {
  const user = userEvent.setup()
  handle.focus()
  await user.keyboard('[Space]')
  await user.keyboard('[ArrowDown]')
  await user.keyboard('[Space]')
}

describe('sortable list drag and drop', () => {
  let rectSpy: ReturnType<typeof mockRowRects>

  beforeEach(() => {
    rectSpy = mockRowRects()
  })

  afterEach(() => {
    rectSpy.mockRestore()
  })

  it('moves an item one row down', async () => {
    const onItemMove = vi.fn()
    render(<SortableRows onItemMove={onItemMove} />)

    await dragDownOneRow(getHandle('item-a'))

    expect(onItemMove).toHaveBeenCalledExactlyOnceWith({fromIndex: 0, toIndex: 1})
  })

  it('still moves an item after its drag handle remounted inside the same item', async () => {
    const onItemMove = vi.fn()
    render(<SortableRows onItemMove={onItemMove} />)

    await userEvent.click(screen.getByRole('button', {name: 'remount handles'}))
    await dragDownOneRow(getHandle('item-a'))

    expect(onItemMove).toHaveBeenCalledExactlyOnceWith({fromIndex: 0, toIndex: 1})
  })

  it('does not start a drag from a read-only handle', async () => {
    const onItemMove = vi.fn()
    render(<SortableRows onItemMove={onItemMove} readOnly />)

    await dragDownOneRow(getHandle('item-a'))

    expect(onItemMove).not.toHaveBeenCalled()
  })
})
