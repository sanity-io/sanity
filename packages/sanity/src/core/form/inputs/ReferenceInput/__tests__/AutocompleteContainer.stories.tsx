import {type Meta, type StoryObj} from '@storybook/react-vite'
import {waitFor, within} from 'storybook/test'

import {AutocompleteContainerStory} from './AutocompleteContainerStory'

/**
 * Reuses the in-package harness: reference AutocompleteContainer narrow/wide
 * Grid after the ui5 migration. `play` waits until `useElementSize` has
 * applied the breakpoint so Chromatic does not snapshot the 480px default.
 */
const meta = {
  title: 'Form/Autocomplete Container',
  component: AutocompleteContainerStory,
} satisfies Meta<typeof AutocompleteContainerStory>

export default meta
type Story = StoryObj<typeof meta>

function columnCount(host: HTMLElement): number {
  const grid = host.firstElementChild
  if (!(grid instanceof HTMLElement)) {
    return 0
  }
  return getComputedStyle(grid).gridTemplateColumns.split(' ').length
}

export const States: Story = {
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    const narrowHost = canvas.getByTestId('autocomplete-narrow')
    const wideHost = canvas.getByTestId('autocomplete-wide')
    await waitFor(
      () => {
        if (columnCount(narrowHost) !== 1) {
          throw new Error(`expected narrow grid to have 1 column, got ${columnCount(narrowHost)}`)
        }
        if (columnCount(wideHost) !== 2) {
          throw new Error(`expected wide grid to have 2 columns, got ${columnCount(wideHost)}`)
        }
      },
      {timeout: 3000},
    )
  },
}
