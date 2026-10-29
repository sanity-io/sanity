import {render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {PerspectiveFilter} from '../PerspectiveFilter'

describe('PerspectiveFilter', () => {
  it('does not render the remove control without an accessible label', async () => {
    const wrapper = await createTestProvider()
    render(
      <PerspectiveFilter prefix="Version" tone="default" onRemove={() => {}}>
        <button type="button">Draft</button>
      </PerspectiveFilter>,
      {wrapper},
    )

    expect(screen.queryByTestId('perspective-filter-remove')).not.toBeInTheDocument()
  })

  it('exposes the remove control by its accessible name', async () => {
    const wrapper = await createTestProvider()
    render(
      <PerspectiveFilter
        prefix="Version"
        tone="default"
        onRemove={() => {}}
        removeLabel="Clear version selection"
      >
        <button type="button">Draft</button>
      </PerspectiveFilter>,
      {wrapper},
    )

    expect(screen.getByRole('button', {name: 'Clear version selection'})).toBeInTheDocument()
  })
})
