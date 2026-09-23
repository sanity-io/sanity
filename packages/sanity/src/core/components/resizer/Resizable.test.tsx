import {render, screen} from '@testing-library/react'
import {type ComponentProps} from 'react'
import {describe, expect, test} from 'vitest'

import {Resizable} from './Resizable'

function CustomRoot(props: ComponentProps<'div'>) {
  return <div {...props} data-custom-root="" />
}

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
    expect(aside.querySelector('[position]')).toBeNull()
    expect(screen.getByText('inspector body')).toBeInTheDocument()
  })

  test('preserves Box layout props when rendered as a custom component', () => {
    render(
      <Resizable
        as={CustomRoot}
        data-testid="custom-resizable"
        flexBasis="25%"
        flexGrow={2}
        minWidth={320}
        maxWidth={640}
      />,
    )

    const root = screen.getByTestId('custom-resizable')

    expect(root).toHaveAttribute('data-custom-root')
    expect(root).toHaveClass('sui-flex-basis', 'sui-flex-grow')
    expect(root.style.getPropertyValue('--flex-basis')).toBe('25%')
    expect(root.style.getPropertyValue('--flex-grow')).toBe('2')
  })
})
