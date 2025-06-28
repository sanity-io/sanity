import {Root} from '@sanity/ui'
import {render as renderRTL, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {SchemaIcon, type SchemaIconProps} from '../Icon'

const render = (props?: Partial<SchemaIconProps>) =>
  renderRTL(<SchemaIcon title="Studio" {...props} />, {
    wrapper: ({children}) => <Root as="div">{children}</Root>,
  })

describe('SchemaIcon', () => {
  it("should render the title's first letter as uppercase when there is no icon present & the title is a single word", () => {
    render()

    expect(screen.getByText('S')).toBeInTheDocument()
  })

  it('should render the first two letters of a multi-word title as uppercase when there is no icon present', () => {
    render({title: 'My Studio'})

    expect(screen.getByText('MS')).toBeInTheDocument()
  })

  it('should render the icon when present as a ComponentType', () => {
    render({
      icon: () => (
        <svg data-testid="icon">
          <rect fill="#ff0000" height="32" width="32" />
        </svg>
      ),
    })

    expect(screen.getByTestId('icon')).toBeInTheDocument()
    expect(screen.queryByText('S')).not.toBeInTheDocument()
  })

  it('should render the icon when present as a ReactNode', () => {
    render({
      icon: (
        <svg data-testid="icon">
          <rect fill="#ff0000" height="32" width="32" />
        </svg>
      ),
    })

    expect(screen.getByTestId('icon')).toBeInTheDocument()
    expect(screen.queryByText('S')).not.toBeInTheDocument()
  })
})
