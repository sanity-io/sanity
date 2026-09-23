import {render, screen} from '@testing-library/react'
import {describe, expect, test} from 'vitest'

import {Resizable} from './Resizable'

describe('Resizable', () => {
  test('does not leak flexGrow/flexBasis onto the DOM when rendered as aside', () => {
    render(
      <Resizable
        as="aside"
        data-ui="DocumentInspectorPanel"
        data-testid="resizable-aside"
        flexGrow={1}
        flexBasis="0%"
        resizerPosition="left"
        minWidth={320}
        maxWidth={640}
      >
        <div>inspector body</div>
      </Resizable>,
    )

    const aside = screen.getByTestId('resizable-aside')
    const attrNames = Array.from(aside.attributes).map((a) => a.name.toLowerCase())

    expect(aside.tagName.toLowerCase()).toBe('aside')
    expect(aside).toHaveAttribute('data-ui', 'DocumentInspectorPanel')
    expect(attrNames).not.toContain('flexgrow')
    expect(attrNames).not.toContain('flexbasis')
    expect(screen.getByText('inspector body')).toBeInTheDocument()
  })
})
