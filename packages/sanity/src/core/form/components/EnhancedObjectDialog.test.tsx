import {render} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {EnhancedObjectDialog} from './EnhancedObjectDialog'

const close = vi.fn()
const navigateTo = vi.fn()
const log = vi.fn()

let mockState: {isTop: boolean; stack: {id: string; path: (string | {_key: string})[]}[]}

vi.mock('../../hooks/useDialogStack', () => ({
  useDialogStack: () => ({
    dialogId: 'dialog-1',
    topEntry: mockState.stack[mockState.stack.length - 1] ?? null,
    stack: mockState.stack,
    isTop: mockState.isTop,
    close,
    navigateTo,
  }),
}))

vi.mock('../useFormBuilder', () => ({
  useFormBuilder: () => ({__internal: {inspectOpen: false}}),
}))

vi.mock('@sanity/telemetry/react', () => ({
  useTelemetry: () => ({log}),
}))

// Keep the real useGlobalKeyDown (it registers the window keydown listener under
// test) but render Box as a plain div so we don't need a full Sanity theme context.
vi.mock('@sanity/ui', async (importActual) => ({
  ...((await importActual()) as Record<string, unknown>),
  Box: ({children}: {children: React.ReactNode}) => <div>{children}</div>,
}))

// Render the dialog chrome as plain pass-throughs so the test stays focused on the
// global keydown handler (no theme/portal/presence setup required). Partial mocks
// preserve the other real exports (e.g. Button used by DialogBreadcrumbs).
vi.mock('../../../ui-components', async (importActual) => ({
  ...((await importActual()) as Record<string, unknown>),
  Dialog: ({children}: {children: React.ReactNode}) => <div data-testid="dialog">{children}</div>,
}))
vi.mock('../../components', async (importActual) => ({
  ...((await importActual()) as Record<string, unknown>),
  PopoverDialog: ({children}: {children: React.ReactNode}) => <div>{children}</div>,
}))
vi.mock('../../presence', async (importActual) => ({
  ...((await importActual()) as Record<string, unknown>),
  PresenceOverlay: ({children}: {children: React.ReactNode}) => <div>{children}</div>,
}))

function renderDialog() {
  return render(
    <EnhancedObjectDialog type="dialog" header="Header" width={1}>
      <div />
    </EnhancedObjectDialog>,
  )
}

function dispatchKeyDown(target: Element, init: KeyboardEventInit): KeyboardEvent {
  const event = new KeyboardEvent('keydown', {bubbles: true, cancelable: true, ...init})
  target.dispatchEvent(event)
  return event
}

describe('EnhancedObjectDialog: Cmd/Ctrl+ArrowUp handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // The top stack entry's path length must be > 1 for the navigate-up / close
    // branch to be reachable (the handler checks `lastStackPath.length > 1`).
    mockState = {isTop: true, stack: [{id: 'dialog-1', path: ['arr', {_key: 'k'}]}]}
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('ignores the shortcut when focus is inside an <input> (SAPP-3704)', () => {
    renderDialog()
    const input = document.createElement('input')
    document.body.appendChild(input)

    const event = dispatchKeyDown(input, {key: 'ArrowUp', metaKey: true})

    expect(close).not.toHaveBeenCalled()
    expect(navigateTo).not.toHaveBeenCalled()
    expect(event.defaultPrevented).toBe(false)
  })

  it('ignores the shortcut when focus is inside a <textarea>', () => {
    renderDialog()
    const textarea = document.createElement('textarea')
    document.body.appendChild(textarea)

    const event = dispatchKeyDown(textarea, {key: 'ArrowUp', metaKey: true})

    expect(close).not.toHaveBeenCalled()
    expect(navigateTo).not.toHaveBeenCalled()
    expect(event.defaultPrevented).toBe(false)
  })

  it('ignores the shortcut when focus is inside a contentEditable element (code/PTE editor)', () => {
    renderDialog()
    const editable = document.createElement('div')
    editable.setAttribute('contenteditable', 'true')
    // jsdom does not always derive isContentEditable from the attribute, so set it explicitly.
    Object.defineProperty(editable, 'isContentEditable', {configurable: true, value: true})
    document.body.appendChild(editable)

    const event = dispatchKeyDown(editable, {key: 'ArrowUp', metaKey: true})

    expect(close).not.toHaveBeenCalled()
    expect(navigateTo).not.toHaveBeenCalled()
    expect(event.defaultPrevented).toBe(false)
  })

  it('handles the shortcut when focus is on a non-editable element', () => {
    renderDialog()
    const button = document.createElement('button')
    document.body.appendChild(button)

    const event = dispatchKeyDown(button, {key: 'ArrowUp', metaKey: true})

    // path length 2 -> parent path length 1 -> close()
    expect(close).toHaveBeenCalledTimes(1)
    expect(event.defaultPrevented).toBe(true)
  })

  it('handles ctrl+ArrowUp on a non-editable element too', () => {
    renderDialog()
    const button = document.createElement('button')
    document.body.appendChild(button)

    dispatchKeyDown(button, {key: 'ArrowUp', ctrlKey: true})

    expect(close).toHaveBeenCalledTimes(1)
  })

  it('does nothing when the dialog is not the top dialog', () => {
    mockState = {isTop: false, stack: [{id: 'dialog-1', path: ['arr', {_key: 'k'}]}]}
    renderDialog()
    const button = document.createElement('button')
    document.body.appendChild(button)

    dispatchKeyDown(button, {key: 'ArrowUp', metaKey: true})

    expect(close).not.toHaveBeenCalled()
    expect(navigateTo).not.toHaveBeenCalled()
  })
})
