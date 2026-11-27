import {cleanup, render, screen} from '@testing-library/react'
import {afterEach, describe, expect, it} from 'vitest'

import {OptionsGrid, OptionsGridToggleCell} from './OptionsGrid'
import * as styles from './OptionsGrid.module.css'

function cellIds(grid: HTMLElement) {
  return [...grid.children].map((cell) =>
    cell.getAttribute('data-testid') === 'vision-options-toggle-cell'
      ? cell.firstElementChild?.getAttribute('data-testid')
      : cell.getAttribute('data-testid'),
  )
}

describe('OptionsGrid', () => {
  afterEach(cleanup)

  it('lays the selects and toggles out on one grid, only the source map toggle two columns wide', () => {
    render(
      <OptionsGrid testId="options">
        <div data-testid="api-version" />
        <div data-testid="dataset" />
        <div data-testid="perspective" />
        <div data-testid="variant" />
        <OptionsGridToggleCell>
          <div data-testid="use-cdn" />
        </OptionsGridToggleCell>
        <OptionsGridToggleCell wide>
          <div data-testid="source-map" />
        </OptionsGridToggleCell>
      </OptionsGrid>,
    )

    const grid = screen.getByTestId('vision-options-grid')
    expect(grid.classList.contains(styles.grid)).toBe(true)
    expect(cellIds(grid)).toEqual([
      'api-version',
      'dataset',
      'perspective',
      'variant',
      'use-cdn',
      'source-map',
    ])
    const [cdnCell, sourceMapCell] = screen.getAllByTestId('vision-options-toggle-cell')
    expect(cdnCell.classList.contains(styles.toggle)).toBe(true)
    expect(cdnCell.classList.contains(styles.wide)).toBe(false)
    expect(sourceMapCell.classList.contains(styles.toggle)).toBe(true)
    expect(sourceMapCell.classList.contains(styles.wide)).toBe(true)
  })

  it('keeps the CDN toggle in an ordinary cell when the source map toggle is not rendered', () => {
    const showSourceMap = false
    render(
      <OptionsGrid>
        <div data-testid="api-version" />
        <div data-testid="dataset" />
        <OptionsGridToggleCell>
          <div data-testid="use-cdn" />
        </OptionsGridToggleCell>
        {showSourceMap && (
          <OptionsGridToggleCell wide>
            <div data-testid="source-map" />
          </OptionsGridToggleCell>
        )}
      </OptionsGrid>,
    )

    expect(cellIds(screen.getByTestId('vision-options-grid'))).toEqual([
      'api-version',
      'dataset',
      'use-cdn',
    ])
    const [cdnCell, ...rest] = screen.getAllByTestId('vision-options-toggle-cell')
    expect(rest).toEqual([])
    expect(cdnCell.classList.contains(styles.wide)).toBe(false)
  })
})
