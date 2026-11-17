import {describe, expect, it} from 'vitest'

import {sparkline} from '../sparkline'

describe('sparkline', () => {
  it('scales values to the block ramp', () => {
    expect(sparkline([0, 1, 2, 3, 4, 5, 6, 7], 7)).toBe('▁▂▃▄▅▆▇█')
  })

  it('defaults max to the series peak', () => {
    expect(sparkline([0, 50, 100])).toBe('▁▅█')
  })

  it('renders an all-quiet series as the floor', () => {
    expect(sparkline([0, 0, 0])).toBe('▁▁▁')
  })

  it('clamps values above max', () => {
    expect(sparkline([200], 100)).toBe('█')
  })

  it('returns empty for an empty series', () => {
    expect(sparkline([])).toBe('')
  })
})
