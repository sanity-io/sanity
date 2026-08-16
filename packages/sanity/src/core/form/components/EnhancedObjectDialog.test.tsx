import {type Path} from '@sanity/types'
import {render} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {NestedDialogOpened} from '../studio/tree-editing/__telemetry__/nestedObjects.telemetry'
import {EnhancedObjectDialog} from './EnhancedObjectDialog'

const close = vi.fn()
const navigateTo = vi.fn()
const log = vi.fn()

let mockState: {isTop: boolean; stack: {id: string; path: (string | {_key: string})[]}[]}

// The real hook falls back to a fresh array when no DialogStackProvider is mounted,
// so the mock deliberately returns a new array on every render.
vi.mock('../../hooks/useDialogStack', () => ({
  useDialogStack: () => ({
    dialogId: 'dialog-1',
    topEntry: mockState.stack[mockState.stack.length - 1] ?? null,
    stack: [...mockState.stack],
    isTop: mockState.isTop,
    close,
    navigateTo,
  }),
}))

vi.mock('../useFormBuilder', () => ({
  useFormBuilder: () => ({__internal: {inspectOpen: false}}),
}))

// The real hook reads the logger off a context, so the mock keeps one stable instance.
const telemetryLogger = {log}

vi.mock('@sanity/telemetry/react', () => ({
  useTelemetry: () => telemetryLogger,
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
vi.mock('../../../ui-components/dialog/Dialog', async (importActual) => ({
  ...((await importActual()) as Record<string, unknown>),
  Dialog: ({children}: {children: React.ReactNode}) => <div data-testid="dialog">{children}</div>,
}))
vi.mock('../../components/popoverDialog/PopoverDialog', async (importActual) => ({
  ...((await importActual()) as Record<string, unknown>),
  PopoverDialog: ({children}: {children: React.ReactNode}) => <div>{children}</div>,
}))
vi.mock('../../presence/overlay/PresenceOverlay', async (importActual) => ({
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

function ObjectInput(_props: {path?: Path; absolutePath?: Path}) {
  return <div />
}

function objectDialog(props: {path?: Path; absolutePath?: Path}) {
  return (
    <EnhancedObjectDialog type="dialog" header="Header" width={1}>
      <ObjectInput {...props} />
    </EnhancedObjectDialog>
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

  it('ignores the shortcut when focus is inside an <input>', () => {
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

describe('EnhancedObjectDialog: open telemetry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockState = {isTop: true, stack: []}
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('logs the serialized field path of the object being opened', () => {
    render(objectDialog({path: ['arr', {_key: 'k'}, 'title']}))

    expect(log).toHaveBeenCalledWith(NestedDialogOpened, {path: 'arr[_key=="k"].title'})
  })

  it('prefers the absolute path over the relative one', () => {
    render(objectDialog({path: ['title'], absolutePath: ['body', {_key: 'block'}, 'title']}))

    expect(log).toHaveBeenCalledWith(NestedDialogOpened, {path: 'body[_key=="block"].title'})
  })

  it('logs an empty path when the child exposes none', () => {
    render(objectDialog({}))

    expect(log).toHaveBeenCalledWith(NestedDialogOpened, {path: ''})
  })

  it('logs once per open, not once per render', () => {
    const {rerender} = render(objectDialog({path: ['arr', {_key: 'k'}]}))

    rerender(objectDialog({path: ['arr', {_key: 'k'}]}))

    expect(log).toHaveBeenCalledTimes(1)
  })
})
