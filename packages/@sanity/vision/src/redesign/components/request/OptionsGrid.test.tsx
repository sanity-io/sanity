import {render, screen, within} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {OptionsGrid} from './OptionsGrid'

describe('OptionsGrid', () => {
  it('lays the toggles out in a grid of their own, apart from the columns of the selects', () => {
    render(
      <OptionsGrid
        fields={
          <>
            <div data-testid="dataset" />
            <div data-testid="api-version" />
            <div data-testid="perspective" />
          </>
        }
        testId="options"
        toggles={
          <>
            <div data-testid="source-map" />
            <div data-testid="use-cdn" />
          </>
        }
      />,
    )

    const fields = screen.getByTestId('vision-options-fields')
    const toggles = screen.getByTestId('vision-options-toggles')
    expect([...fields.children].map((child) => child.getAttribute('data-testid'))).toEqual([
      'dataset',
      'api-version',
      'perspective',
    ])
    expect([...toggles.children].map((child) => child.getAttribute('data-testid'))).toEqual([
      'source-map',
      'use-cdn',
    ])
    // Neither grid holds the other, so the toggles never take the selects' column tracks
    expect(fields.contains(toggles)).toBe(false)
    expect(toggles.contains(fields)).toBe(false)
    expect(within(screen.getByTestId('options')).getByTestId('vision-options-toggles')).toBe(
      toggles,
    )
  })
})
