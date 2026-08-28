import {render, screen} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {useState} from 'react'
import {describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {FormFieldSet} from './FormFieldSet'

function Counter() {
  const [count, setCount] = useState(0)
  return (
    <button data-testid="counter" onClick={() => setCount((current) => current + 1)} type="button">
      {count}
    </button>
  )
}

describe('FormFieldSet', () => {
  it('does not render children while initially collapsed', async () => {
    const wrapper = await createTestProvider()
    const Probe = vi.fn(() => <div data-testid="content" />)

    render(
      <FormFieldSet collapsed collapsible inputId="test" path={['test']} title="Test">
        <Probe />
      </FormFieldSet>,
      {wrapper},
    )

    expect(screen.queryByTestId('content')).toBeNull()
    expect(Probe).not.toHaveBeenCalled()
  })

  it('keeps children mounted but hidden when collapsing after having been expanded', async () => {
    const wrapper = await createTestProvider()

    const {rerender} = render(
      <FormFieldSet collapsed={false} collapsible inputId="test" path={['test']} title="Test">
        <div data-testid="content" />
      </FormFieldSet>,
      {wrapper},
    )

    expect(screen.getByTestId('content')).toBeVisible()

    rerender(
      <FormFieldSet collapsed collapsible inputId="test" path={['test']} title="Test">
        <div data-testid="content" />
      </FormFieldSet>,
    )

    expect(screen.getByTestId('content')).not.toBeVisible()
  })

  it('preserves child component state across collapse and expand', async () => {
    const wrapper = await createTestProvider()

    const {rerender} = render(
      <FormFieldSet collapsed={false} collapsible inputId="test" path={['test']} title="Test">
        <Counter />
      </FormFieldSet>,
      {wrapper},
    )

    await userEvent.click(screen.getByTestId('counter'))
    expect(screen.getByTestId('counter')).toHaveTextContent('1')

    rerender(
      <FormFieldSet collapsed collapsible inputId="test" path={['test']} title="Test">
        <Counter />
      </FormFieldSet>,
    )
    rerender(
      <FormFieldSet collapsed={false} collapsible inputId="test" path={['test']} title="Test">
        <Counter />
      </FormFieldSet>,
    )

    expect(screen.getByTestId('counter')).toBeVisible()
    expect(screen.getByTestId('counter')).toHaveTextContent('1')
  })
})
