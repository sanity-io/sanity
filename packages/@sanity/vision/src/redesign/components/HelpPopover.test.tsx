import {LayerProvider, ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {act, cleanup, fireEvent, render, screen, within} from '@testing-library/react'
import {afterAll, afterEach, beforeAll, describe, expect, it, vi} from 'vitest'

import {HelpPopover, type HelpPopoverProps} from './HelpPopover'

vi.mock('sanity', () => ({
  defineLocalesResources: (_namespace: string, resources: unknown) => resources,
}))
vi.mock('sanity/i18n', () => ({
  defineLocaleResourceBundle: (bundle: unknown) => bundle,
  useTranslation: () => ({t: (key: string) => key}),
}))

vi.stubGlobal(
  'matchMedia',
  vi.fn((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
)

// jsdom lays nothing out, so Floating UI reports the button as clipped and the open popover gets
// the `hidden` attribute, and jsdom focuses nothing under a hidden ancestor
const floatingCardStyles = document.createElement('style')
floatingCardStyles.textContent = '[data-placement][hidden] { display: flex; }'

const theme = buildTheme()

function renderHelp(props: Partial<HelpPopoverProps> = {}) {
  render(
    <ThemeProvider theme={theme}>
      <LayerProvider>
        <button data-testid="elsewhere" type="button">
          Elsewhere
        </button>
        <HelpPopover
          content={['First paragraph', 'Second paragraph']}
          label="About the thing"
          testId="help"
          {...props}
        />
      </LayerProvider>
    </ThemeProvider>,
  )
}

const button = () => screen.getByTestId('help')
const isOpen = () => button().getAttribute('aria-expanded') === 'true'

async function open() {
  await act(async () => {
    fireEvent.click(button())
  })
  return screen.getByTestId('help-content')
}

describe('HelpPopover', () => {
  beforeAll(() => document.head.append(floatingCardStyles))
  afterAll(() => floatingCardStyles.remove())
  afterEach(() => cleanup())

  it('opens a dialog with the heading, the paragraphs and a docs link on click', async () => {
    renderHelp({docsUrl: 'https://www.sanity.io/docs/example', title: 'The thing'})
    expect(button().getAttribute('aria-label')).toBe('About the thing')
    expect(isOpen()).toBe(false)

    const dialog = await open()
    expect(isOpen()).toBe(true)
    expect(dialog.getAttribute('role')).toBe('dialog')
    expect(button().getAttribute('aria-controls')).toBe(dialog.id)
    const heading = within(dialog).getByText('The thing')
    expect(dialog.getAttribute('aria-labelledby')).toBe(heading.id)
    expect(within(dialog).getByText('First paragraph')).toBeTruthy()
    expect(within(dialog).getByText('Second paragraph')).toBeTruthy()
    const docs = within(dialog).getByTestId('help-docs')
    expect(docs.getAttribute('href')).toBe('https://www.sanity.io/docs/example')
    expect(docs.getAttribute('target')).toBe('_blank')
    expect(docs.textContent).toBe('vision.help.read-docs →')
    // Focus moves into the dialog, so Tab reaches its link
    expect(document.activeElement).toBe(dialog)
  })

  it('is headed by its label without a title, and links no docs without a docs URL', async () => {
    renderHelp()
    const dialog = await open()
    expect(within(dialog).getByText('About the thing')).toBeTruthy()
    expect(within(dialog).queryByTestId('help-docs')).toBeNull()
  })

  it('closes on Escape and gives focus back to the button', async () => {
    renderHelp()
    await open()
    await act(async () => {
      fireEvent.keyDown(window, {key: 'Escape'})
    })
    expect(isOpen()).toBe(false)
    expect(document.activeElement).toBe(button())
  })

  it('closes on a click outside, and stays open on a click inside', async () => {
    renderHelp()
    const dialog = await open()
    await act(async () => {
      fireEvent.mouseDown(within(dialog).getByText('First paragraph'))
    })
    expect(isOpen()).toBe(true)
    await act(async () => {
      fireEvent.mouseDown(screen.getByTestId('elsewhere'))
    })
    expect(isOpen()).toBe(false)
  })

  it('closes when its button is pressed again', async () => {
    renderHelp()
    await open()
    await act(async () => {
      fireEvent.mouseDown(button())
      fireEvent.click(button())
    })
    expect(isOpen()).toBe(false)
  })
})
