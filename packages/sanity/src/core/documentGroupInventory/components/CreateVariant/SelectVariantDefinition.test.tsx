import {act, render, screen, waitFor, within} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {afterEach, beforeAll, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {type SystemVariant} from '../../../variants/types'
import {MIN_MENU_WIDTH} from './CreateVariantPicker'
import {SelectVariantDefinition} from './SelectVariantDefinition'

function definition(id: string, title: string): SystemVariant {
  return {
    _id: id,
    _type: 'system.variant',
    _rev: 'rev',
    _createdAt: '2026-01-01T00:00:00Z',
    _updatedAt: '2026-01-01T00:00:00Z',
    conditions: {},
    priority: 0,
    metadata: {title},
  } as unknown as SystemVariant
}

const NORDIC = definition('_.variants.nordic', 'Nordic region')
const DANISH = definition('_.variants.danish', 'Danish')
const GERMAN = definition('_.variants.german', 'German')

let wrapper: React.ComponentType<{children: React.ReactNode}>

beforeAll(async () => {
  wrapper = await createTestProvider()
})

async function openMenu(existingVariantIds: ReadonlySet<string>) {
  render(
    <SelectVariantDefinition
      variantDefinitions={[NORDIC, DANISH, GERMAN]}
      existingVariantIds={existingVariantIds}
      value={undefined}
      onChange={vi.fn()}
      disabled={false}
    />,
    {wrapper},
  )
  await userEvent.click(screen.getByTestId('create-variant-variant-menu-button'))
  return screen.findByTestId('create-variant-variant-menu')
}

// The test environment mocks `matchMedia` as matching nothing, which reads as a touch device
function stubPointer({finePointerWithHover}: {finePointerWithHover: boolean}) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: finePointerWithHover,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }))
}

describe('SelectVariantDefinition', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('opens the menu as wide as the select, and keeps that width while the filter narrows the list', async () => {
    // jsdom has no layout: the select "measures" 320px when the menu opens
    const rect = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockReturnValue(new DOMRect(0, 0, 320, 33))
    try {
      const menu = await openMenu(new Set([NORDIC._id]))
      await waitFor(() => expect(menu).toHaveStyle({width: '320px'}))

      await userEvent.type(screen.getByPlaceholderText('Search variant definitions…'), 'dan')

      expect(within(menu).queryByText('German')).not.toBeInTheDocument()
      expect(menu).toHaveStyle({width: '320px'})
    } finally {
      rect.mockRestore()
    }
  })

  it('never opens the menu narrower than MIN_MENU_WIDTH', async () => {
    const menu = await openMenu(new Set())

    expect(MIN_MENU_WIDTH).toBe(288)
    expect(menu.style.minWidth).toBe(`min(${MIN_MENU_WIDTH}px, calc(100vw - 24px))`)
  })

  it('starts empty, with the hint and a variant mark', () => {
    render(
      <SelectVariantDefinition
        variantDefinitions={[NORDIC, DANISH, GERMAN]}
        existingVariantIds={new Set()}
        value={undefined}
        onChange={vi.fn()}
        disabled={false}
      />,
      {wrapper},
    )

    expect(screen.getByTestId('create-variant-variant-menu-value')).toHaveTextContent(
      'Choose who sees it',
    )
    expect(
      screen
        .getByTestId('create-variant-variant-menu-glyph')
        .querySelector('[data-ui="VariantMark"]'),
    ).toBeInTheDocument()
  })

  it('shows the picked variant with its mark', () => {
    render(
      <SelectVariantDefinition
        variantDefinitions={[NORDIC, DANISH, GERMAN]}
        existingVariantIds={new Set([DANISH._id])}
        value={DANISH}
        onChange={vi.fn()}
        disabled={false}
      />,
      {wrapper},
    )

    expect(screen.getByTestId('create-variant-variant-menu-value')).toHaveTextContent('Danish')
    expect(
      screen
        .getByTestId('create-variant-variant-menu-glyph')
        .querySelector('[data-ui="VariantMark"][data-fill="filled"]'),
    ).toBeInTheDocument()
  })

  it('focuses the search field when the picker opens, and the arrow keys move into the list', async () => {
    stubPointer({finePointerWithHover: true})

    await openMenu(new Set([NORDIC._id]))
    await waitFor(() =>
      expect(screen.getByPlaceholderText('Search variant definitions…')).toHaveFocus(),
    )

    await userEvent.keyboard('{ArrowDown}')

    await waitFor(() =>
      expect(screen.getByPlaceholderText('Search variant definitions…')).not.toHaveFocus(),
    )
    expect(document.activeElement).toHaveAttribute('data-ui', 'MenuItem')
  })

  it('leaves the search field alone on a touch device, where focus opens the on-screen keyboard', async () => {
    stubPointer({finePointerWithHover: false})

    await openMenu(new Set([NORDIC._id]))
    await act(() => new Promise((resolve) => setTimeout(resolve, 100)))

    expect(screen.getByPlaceholderText('Search variant definitions…')).not.toHaveFocus()
  })

  it('lists the variants the document has first, under their own heading, then the others', async () => {
    const menu = await openMenu(new Set([GERMAN._id]))
    const text = menu.textContent ?? ''

    expect(within(menu).getByText('Has 1 variant')).toBeInTheDocument()
    expect(within(menu).getByText('Other variants')).toBeInTheDocument()
    expect(text.indexOf('Has 1 variant')).toBeLessThan(text.indexOf('German'))
    expect(text.indexOf('German')).toBeLessThan(text.indexOf('Other variants'))
    expect(text.indexOf('Other variants')).toBeLessThan(text.indexOf('Nordic region'))
  })

  it('shows no headings when the document has no variants yet', async () => {
    const menu = await openMenu(new Set())

    expect(within(menu).queryByText(/^Has \d+ variants?$/)).not.toBeInTheDocument()
    expect(within(menu).queryByText('Other variants')).not.toBeInTheDocument()
    expect(within(menu).getByText('Nordic region')).toBeInTheDocument()
  })

  it('names the search field with the variant search placeholder', async () => {
    const menu = await openMenu(new Set())

    // The accessible name, not only the visible placeholder
    expect(within(menu).getByLabelText('Search variant definitions…')).toBeInTheDocument()
  })

  it('uses the variant search placeholder', async () => {
    const menu = await openMenu(new Set())

    expect(within(menu).getByPlaceholderText('Search variant definitions…')).toBeInTheDocument()
  })
})
