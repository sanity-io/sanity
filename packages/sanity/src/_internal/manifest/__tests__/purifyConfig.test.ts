import DOMPurify from 'isomorphic-dompurify'
import {describe, expect, it} from 'vitest'

import {config} from '../purifyConfig'

describe('purifyConfig', () => {
  it('keeps vector-effect on sanitized svgs and still drops event handlers', () => {
    const svg = [
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">',
      '<path d="M10 10 H90" stroke="#111" stroke-width="2" fill="none" vector-effect="non-scaling-stroke" onclick="alert(1)"/>',
      '</svg>',
    ].join('')

    const sanitized = DOMPurify.sanitize(svg, config)

    expect(sanitized).toContain('vector-effect="non-scaling-stroke"')
    expect(sanitized).not.toContain('onclick')
    expect(sanitized).not.toContain('alert')
  })
})
