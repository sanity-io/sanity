import {Schema} from '@sanity/schema'
import {LayerProvider, ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {act, cleanup, fireEvent, render, screen, within} from '@testing-library/react'
import {type KeyboardEventHandler, type ReactNode, useState} from 'react'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {type Params} from '../../../util/parseParams'
import {ParamsForm} from './ParamsForm'

const schema = Schema.compile({name: 'test', types: []})

const PICKED = '2026-03-04T05:06:00.000Z'

vi.mock('sanity', () => ({
  defineLocalesResources: (_namespace: string, resources: unknown) => resources,
}))
vi.mock('sanity/i18n', () => ({
  defineLocaleResourceBundle: (bundle: unknown) => bundle,
  InlineCode: ({children}: {children?: ReactNode}) => <code>{children}</code>,
  useTranslation: () => ({t: (key: string) => key}),
}))
// The Studio's calendar reads the time zone from the studio preferences; it is covered by its own
// tests, and stands in here for what it sends and receives
vi.mock('sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2', () => ({
  getCalendarLabels: (t: (key: string) => string) => ({
    ariaLabel: t('calendar.button.aria-label'),
    tooltipText: t('calendar.button.tooltip-text'),
  }),
  DatePicker: (props: {
    value?: Date
    selectTime?: boolean
    onChange: (date: Date) => void
    onKeyUp: KeyboardEventHandler<HTMLDivElement>
  }) => (
    <div data-testid="date-picker" onKeyUp={props.onKeyUp}>
      <output data-testid="date-picker-value">{props.value?.toISOString() ?? 'none'}</output>
      <output data-testid="date-picker-select-time">{String(props.selectTime)}</output>
      <button onClick={() => props.onChange(new Date(PICKED))} type="button">
        pick
      </button>
    </div>
  ),
}))
vi.mock('sanity/_dangerously_use_private_internals_that_do_not_follow_semver-1', () => ({
  useSchema: () => schema,
}))

// @sanity/ui's ThemeProvider reads the color scheme preference
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

const theme = buildTheme()

function Harness(props: {initial: string}) {
  const [raw, setRaw] = useState(props.initial)
  const params: Params = {raw, parsed: JSON.parse(raw), valid: true, error: undefined}
  return (
    <>
      <ParamsForm
        onChange={setRaw}
        onSubmit={() => {}}
        params={params}
        query="*[dateTime(_createdAt) > dateTime($createdAfter)]"
      />
      <output data-testid="raw">{raw}</output>
    </>
  )
}

function renderForm(initial = '{}') {
  render(
    <ThemeProvider theme={theme}>
      <LayerProvider>
        <Harness initial={initial} />
      </LayerProvider>
    </ThemeProvider>,
  )
  const field = screen.getByTestId('vision-params-form-createdAfter')
  return {
    params: () => JSON.parse(screen.getByTestId('raw').textContent || '{}') as unknown,
    input: within(field).getByRole('textbox'),
    // The button is a new element once the picker opens or closes
    openButton: () => within(field).getByRole('button', {name: 'calendar.button.aria-label'}),
  }
}

describe('the date and time param input', () => {
  afterEach(() => cleanup())

  it('opens the Studio calendar, with time, on the current value', () => {
    const {openButton} = renderForm(JSON.stringify({createdAfter: '2025-01-02T03:04:05.000Z'}))
    expect(screen.queryByTestId('date-picker')).toBeNull()
    fireEvent.click(openButton())
    expect(screen.getByTestId('date-picker-value').textContent).toBe('2025-01-02T03:04:05.000Z')
    expect(screen.getByTestId('date-picker-select-time').textContent).toBe('true')
  })

  it('opens on no date when the param is not a date', () => {
    const {openButton} = renderForm(JSON.stringify({createdAfter: 'last week'}))
    fireEvent.click(openButton())
    expect(screen.getByTestId('date-picker-value').textContent).toBe('none')
  })

  it('sends the picked date and time as an ISO 8601 string, and shows it in the input', () => {
    const {openButton, params, input} = renderForm()
    fireEvent.click(openButton())
    fireEvent.click(screen.getByRole('button', {name: 'pick'}))
    expect(params()).toEqual({createdAfter: PICKED})
    expect((input as HTMLInputElement).value).toBe(PICKED)
  })

  it('keeps the input free to type any text into', () => {
    const {params, input} = renderForm()
    fireEvent.change(input, {target: {value: '2026'}})
    expect(params()).toEqual({createdAfter: '2026'})
    fireEvent.change(input, {target: {value: ''}})
    expect(params()).toEqual({})
  })

  it('closes on Escape and on a click outside it', () => {
    const {openButton} = renderForm()
    fireEvent.click(openButton())
    fireEvent.keyUp(screen.getByTestId('date-picker'), {key: 'Escape'})
    expect(screen.queryByTestId('date-picker')).toBeNull()

    fireEvent.click(openButton())
    expect(screen.queryByTestId('date-picker')).not.toBeNull()
    act(() => {
      fireEvent.mouseDown(document.body)
    })
    expect(screen.queryByTestId('date-picker')).toBeNull()
  })

  it('forwards focus and blur of the text input', () => {
    const onFocus = vi.fn()
    const onBlur = vi.fn()
    render(
      <ThemeProvider theme={theme}>
        <LayerProvider>
          <div onBlur={onBlur} onFocus={onFocus}>
            <Harness initial="{}" />
          </div>
        </LayerProvider>
      </ThemeProvider>,
    )
    const input = within(screen.getByTestId('vision-params-form-createdAfter')).getByRole('textbox')
    fireEvent.focus(input)
    fireEvent.blur(input)
    expect(onFocus).toHaveBeenCalledWith(expect.objectContaining({target: input}))
    expect(onBlur).toHaveBeenCalledWith(expect.objectContaining({target: input}))
  })
})
