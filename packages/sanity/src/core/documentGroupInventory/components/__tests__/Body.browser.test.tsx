import {configure} from '@chromatic-com/vitest'
import {type ComponentType} from 'react'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {Body} from '../Body'
import {Container} from '../Container'

// Layout checks with unstyled placeholder rows: nothing here is worth a snapshot.
configure({disableAutoSnapshot: true})

const ROWS = Array.from({length: 40}, (_, index) => index)

/**
 * A host with a bounded height, or one that grows to fit the inventory and says so with
 * `data-document-group-inventory-scroll`, as the document group inspector does in the
 * structure tool's collapsed layout.
 */
const Inventory: ComponentType<{host: 'bounded' | 'growing'}> = ({host}) => {
  return (
    <div
      data-document-group-inventory-scroll={host === 'growing' ? 'ancestor' : undefined}
      style={{
        display: 'flex',
        flexDirection: 'column',
        blockSize: host === 'bounded' ? 300 : undefined,
      }}
    >
      <Container>
        <Body data-testid="body">
          {ROWS.map((row) => (
            <div key={row} style={{blockSize: 32}}>
              Row {row}
            </div>
          ))}
        </Body>
      </Container>
    </div>
  )
}

describe('Body', () => {
  it('scrolls the versions itself, contained, in a bounded host', async () => {
    void render(<Inventory host="bounded" />)

    await expect.element(page.getByTestId('body')).toBeInTheDocument()
    const body = page.getByTestId('body').element()
    await expect.poll(() => body.scrollHeight).toBeGreaterThan(body.clientHeight)

    const style = getComputedStyle(body)
    expect(style.overflowY).toBe('auto')
    expect(style.overscrollBehaviorY).toBe('contain')
  })

  it('is no scroll container when its host says an ancestor scrolls the versions', async () => {
    void render(<Inventory host="growing" />)

    await expect.element(page.getByTestId('body')).toBeInTheDocument()
    const body = page.getByTestId('body').element()

    // A scroll container that cannot scroll still takes touch gestures on iOS, which
    // rubber-band it instead of scrolling the page.
    const style = getComputedStyle(body)
    expect(style.overflowY).toBe('visible')
    expect(style.overscrollBehaviorY).toBe('auto')
    expect(style.maskImage).toBe('none')
    expect(body.clientHeight).toBe(ROWS.length * 32)
    expect(body.scrollHeight).toBe(body.clientHeight)
  })
})
