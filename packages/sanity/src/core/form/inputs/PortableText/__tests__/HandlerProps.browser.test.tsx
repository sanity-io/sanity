/* oxlint-disable no-deprecated -- covers the deprecated handler props, whose editor is a PortableTextEditor */
import {configure} from '@chromatic-com/vitest'
import {type Editor, PortableTextEditor} from '@portabletext/editor'
import {EditorRefPlugin} from '@portabletext/editor/plugins'
import {defineArrayMember, defineField, defineType, type SanityDocument} from '@sanity/types'
import {
  type ClipboardEvent as ReactClipboardEvent,
  createContext,
  createRef,
  type RefObject,
  useCallback,
  useContext,
} from 'react'
import {type InputProps, type PortableTextInputProps, type PortableTextPluginsProps} from 'sanity'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {render} from 'vitest-browser-react'
import {server, userEvent} from 'vitest/browser'

import {TestForm} from '../../../../../../test/browser/TestForm'
import {testHelpers} from '../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'

configure({disableAutoSnapshot: true})

type HandlerProps = Pick<PortableTextInputProps, 'hotkeys' | 'onCopy' | 'onPaste'>

interface HarnessContext {
  outer: HandlerProps
  nested: HandlerProps
  editorRef: RefObject<PortableTextEditor | null>
  setPluginEditor: (depth: Depth, editor: Editor | null) => void
}
const Context = createContext<HarnessContext | null>(null)
const DepthContext = createContext<Depth>('top level')

function HandlerPropsInput(inputProps: InputProps) {
  const context = useContext(Context)!
  const nested = inputProps.path.length > 1
  const handlers = nested ? context.nested : context.outer
  return (
    <DepthContext.Provider value={nested ? 'nested dialog' : 'top level'}>
      {inputProps.renderDefault({
        ...inputProps,
        ...handlers,
        editorRef: context.editorRef,
      } as PortableTextInputProps)}
    </DepthContext.Provider>
  )
}

function HandlerPropsPlugins(props: PortableTextPluginsProps) {
  const {setPluginEditor} = useContext(Context)!
  const depth = useContext(DepthContext)
  const setEditor = useCallback(
    (editor: Editor | null) => setPluginEditor(depth, editor),
    [depth, setPluginEditor],
  )
  return (
    <>
      <EditorRefPlugin ref={setEditor} />
      {props.renderDefault(props)}
    </>
  )
}

const components = {input: HandlerPropsInput, portableText: {plugins: HandlerPropsPlugins}}

const SCHEMA_TYPES = [
  defineType({
    type: 'document',
    name: 'test',
    title: 'Test',
    fields: [
      defineField({
        type: 'array',
        name: 'body',
        of: [
          defineArrayMember({
            type: 'object',
            name: 'handledObject',
            fields: [
              defineField({
                type: 'array',
                name: 'inner',
                of: [defineArrayMember({type: 'block'})],
                components,
              }),
            ],
          }),
          defineArrayMember({type: 'block'}),
        ],
        components,
      }),
    ],
  }),
]

function textBlock(blockKey: string, spanKey: string, text: string) {
  return {
    _type: 'block',
    _key: blockKey,
    style: 'normal',
    markDefs: [],
    children: [{_type: 'span', _key: spanKey, marks: [], text}],
  }
}

const DOCUMENT: SanityDocument = {
  _id: '123',
  _type: 'test',
  _createdAt: '2024-01-01T00:00:00.000Z',
  _updatedAt: '2024-01-01T00:00:00.000Z',
  _rev: '123',
  body: [
    textBlock('a', 'b', 'Alpha'),
    textBlock('c', 'd', 'Bravo'),
    {_type: 'handledObject', _key: 'obj', inner: [textBlock('in', 'inspan', 'Inner')]},
  ],
}

const INSERTED_BLOCK = textBlock('inserted', 'inserted-span', 'Inserted')

type Depth = 'top level' | 'nested dialog'
const DEPTHS: Depth[] = ['top level', 'nested dialog']
/** The text of the block each depth selects in, five characters long in both */
const TEXT: Record<Depth, string> = {'top level': 'Alpha', 'nested dialog': 'Inner'}
const NESTED_EDITABLE = '[data-testid="nested-object-dialog"] [data-slate-editor]'

const keydowns: KeyboardEvent[] = []
const recordKeydown = (event: KeyboardEvent) => keydowns.push(event)
beforeEach(() => {
  keydowns.length = 0
  window.addEventListener('keydown', recordKeydown, true)
})
afterEach(() => window.removeEventListener('keydown', recordKeydown, true))

const keydownPrevented = (key: string) =>
  keydowns.findLast((event) => event.key.toLowerCase() === key.toLowerCase())?.defaultPrevented

const documentIncludes = (state: unknown, fragment: string) =>
  JSON.stringify(state).includes(fragment)

const settle = () => new Promise((resolve) => setTimeout(resolve, 500))

/** Renders the form with `handlers` on the input of the given depth and selects the text there */
async function open(depth: Depth, handlers: HandlerProps, selection: 'word' | 'caret') {
  const {getModifierKey, waitForDocumentState} = testHelpers()
  const editorRef = createRef<PortableTextEditor>()
  const pluginEditorRef: {current: Editor | null} = {current: null}
  const nested = depth === 'nested dialog'
  void render(
    <Context.Provider
      value={{
        outer: nested ? {} : handlers,
        nested: handlers,
        editorRef,
        setPluginEditor: (editorDepth, editor) => {
          if (editorDepth === depth) {
            pluginEditorRef.current = editor
          }
        },
      }}
    >
      <TestWrapper schemaTypes={SCHEMA_TYPES}>
        <TestForm
          document={DOCUMENT}
          focusPath={nested ? ['body', {_key: 'obj'}, 'inner'] : ['body']}
        />
      </TestWrapper>
    </Context.Provider>,
  )
  await waitForDocumentState((state) => JSON.stringify(state) === JSON.stringify(DOCUMENT))
  const editable = await vi.waitFor(
    () => {
      const element = window.document.querySelector<HTMLElement>(
        nested ? NESTED_EDITABLE : '[data-testid="field-body"] [contenteditable="true"]',
      )
      expect(element?.textContent).toContain(TEXT[depth])
      return element!
    },
    {timeout: 10_000},
  )
  if (nested) {
    await userEvent.click(editable)
    // The dialog's editor can miss a key press while it takes focus, so press until the selection lands
    await vi.waitFor(async () => {
      await userEvent.keyboard(
        selection === 'word' ? `{${getModifierKey()}>}a{/${getModifierKey()}}` : '{End}',
      )
      const dom = window.getSelection()!
      expect(selection === 'word' ? dom.toString() : [dom.isCollapsed, dom.anchorOffset]).toEqual(
        selection === 'word' ? TEXT[depth] : [true, 5],
      )
    })
  } else {
    await vi.waitFor(() => expect(editorRef.current).toBeTruthy())
    const path = [{_key: 'a'}, 'children', {_key: 'b'}]
    PortableTextEditor.focus(editorRef.current!)
    PortableTextEditor.select(editorRef.current!, {
      anchor: {path, offset: selection === 'word' ? 0 : 5},
      focus: {path, offset: 5},
    })
  }
  await vi.waitFor(() => {
    const dom = window.getSelection()!
    expect(selection === 'word' ? dom.toString() : [dom.isCollapsed, dom.anchorOffset]).toEqual(
      selection === 'word' ? TEXT[depth] : [true, 5],
    )
  })
  await vi.waitFor(
    () => {
      const path = nested
        ? [{_key: 'in'}, 'children', {_key: 'inspan'}]
        : [{_key: 'a'}, 'children', {_key: 'b'}]
      expect(pluginEditorRef.current?.getSnapshot().context.selection).toMatchObject({
        anchor: {path, offset: selection === 'word' ? 0 : 5},
        focus: {path, offset: 5},
      })
    },
    {timeout: 10_000},
  )
  return {editable, pluginEditorRef, modifier: getModifierKey()}
}

/** A `shift+enter` hotkey that turns the block into a heading and prevents the keydown */
const headingHotkey = (handler: () => void) => ({
  custom: {
    'shift+enter': (event: {preventDefault: () => void}, editor: PortableTextEditor) => {
      handler()
      event.preventDefault()
      PortableTextEditor.toggleBlockStyle(editor, 'h1')
    },
  },
})

const sentKey = (key: string, code: string, modifiers: Partial<KeyboardEvent>) => ({
  type: 'keyboard.keydown' as const,
  originEvent: {
    key,
    code,
    shiftKey: false,
    ctrlKey: false,
    altKey: false,
    metaKey: false,
    ...modifiers,
  },
})

const clipboardEvent = (type: 'copy' | 'paste', text?: string) => {
  const clipboardData = new DataTransfer()
  if (text) {
    clipboardData.setData('text/plain', text)
    clipboardData.setData('text/html', text)
  }
  const event = new ClipboardEvent(type, {bubbles: true, cancelable: true, clipboardData})
  // Firefox ignores the `clipboardData` init member and gives the event an empty DataTransfer
  Object.defineProperty(event, 'clipboardData', {value: clipboardData})
  return event
}

describe.each(DEPTHS)('Portable Text Input handler props at %s', (depth) => {
  const text = TEXT[depth]
  const {waitForDocumentState} = testHelpers()

  it('a marks hotkey toggles the decorator', async () => {
    const {modifier} = await open(
      depth,
      {hotkeys: {marks: {'mod+shift+x': 'strike-through'}}},
      'word',
    )

    await userEvent.keyboard(`{${modifier}>}{Shift>}x{/Shift}{/${modifier}}`)

    await waitForDocumentState((state) => documentIncludes(state, '"marks":["strike-through"]'))
    expect(keydownPrevented('X')).toBe(true)
  })

  it('a custom hotkey runs its handler and prevents the keydown', async () => {
    const handler = vi.fn()
    await open(depth, {hotkeys: headingHotkey(handler)}, 'caret')

    await userEvent.keyboard('{Shift>}{Enter}{/Shift}')

    const state = await waitForDocumentState((value) => documentIncludes(value, '"style":"h1"'))
    await settle()
    expect(documentIncludes(state, `${text}\\n`)).toBe(false)
    expect(handler).toHaveBeenCalledTimes(1)
    expect(keydownPrevented('Enter')).toBe(true)
  })

  it('matching custom hotkey spellings run once each and let the editor insert a line break', async () => {
    const first = vi.fn()
    const second = vi.fn()
    await open(depth, {hotkeys: {custom: {'shift+enter': first, 'Shift+Enter': second}}}, 'caret')

    await userEvent.keyboard('{Shift>}{Enter}{/Shift}')

    const state = await waitForDocumentState((value) => documentIncludes(value, `${text}\\n`))
    expect(documentIncludes(state, `${text}\\n\\n`)).toBe(false)
    expect.soft(first).toHaveBeenCalledTimes(1)
    expect.soft(second).toHaveBeenCalledTimes(1)
  })

  it('a custom hotkey runs when the keydown is sent from code', async () => {
    const handler = vi.fn()
    const {pluginEditorRef} = await open(depth, {hotkeys: headingHotkey(handler)}, 'caret')

    pluginEditorRef.current!.send(sentKey('Enter', 'Enter', {shiftKey: true}))

    const state = await waitForDocumentState((value) => documentIncludes(value, '"style":"h1"'))
    await settle()
    expect(handler).toHaveBeenCalledTimes(1)
    expect(documentIncludes(state, `${text}\\n`)).toBe(false)
  })

  it("a custom hotkey's nativeEvent is a KeyboardEvent when the keydown is sent from code", async () => {
    const received: unknown[] = []
    const {pluginEditorRef, modifier} = await open(
      depth,
      {hotkeys: {custom: {'mod+alt+1': (event) => received.push(event.nativeEvent)}}},
      'caret',
    )
    const modifiers = {altKey: true, ctrlKey: modifier !== 'Meta', metaKey: modifier === 'Meta'}

    pluginEditorRef.current!.send(sentKey('1', 'Digit1', modifiers))

    await expect.poll(() => received.length).toBe(1)
    expect(received[0]).toBeInstanceOf(KeyboardEvent)
    expect(received[0]).toMatchObject({key: '1', code: 'Digit1', ...modifiers})
  })

  // Synthetic clipboard events are not honoured by WebKit
  describe.skipIf(server.browser === 'webkit')('clipboard', () => {
    it("onCopy's returned data fills the clipboard", async () => {
      const onCopy = vi.fn((event: ReactClipboardEvent) => {
        event.clipboardData.setData('text/plain', 'custom-copy')
        return true
      })
      const {editable} = await open(depth, {onCopy}, 'word')
      const event = clipboardEvent('copy')

      editable.dispatchEvent(event)

      expect(onCopy).toHaveBeenCalledTimes(1)
      expect([...event.clipboardData!.types]).toEqual(['text/plain'])
      expect(event.clipboardData!.getData('text/plain')).toBe('custom-copy')
    })

    it('onCopy returning undefined lets the editor fill the clipboard', async () => {
      const onCopy = vi.fn(() => undefined)
      const {editable} = await open(depth, {onCopy}, 'word')
      const event = clipboardEvent('copy')

      editable.dispatchEvent(event)

      expect(onCopy).toHaveBeenCalledTimes(1)
      expect([...event.clipboardData!.types].toSorted()).toEqual([
        'application/json',
        'application/x-portable-text',
        'text/html',
        'text/plain',
      ])
      expect(event.clipboardData!.getData('text/plain')).toBe(text)
      expect(event.defaultPrevented).toBe(true)
    })

    it.each([
      ['an insert result', () => ({insert: [INSERTED_BLOCK]})],
      ['a promise of an insert result', () => Promise.resolve({insert: [INSERTED_BLOCK]})],
    ])("onPaste's %s is inserted", async (_name, onPaste) => {
      const {editable} = await open(depth, {onPaste: onPaste as never}, 'caret')
      const event = clipboardEvent('paste', 'ignored')

      editable.dispatchEvent(event)

      await waitForDocumentState((state) => documentIncludes(state, `${text}Inserted`))
      expect(event.defaultPrevented).toBe(true)
    })

    it("onPaste's event carries the pasted data", async () => {
      const received: string[] = []
      const onPaste = vi.fn(({event}: {event: ReactClipboardEvent}) => {
        received.push(
          event.clipboardData.getData('text/plain'),
          event.nativeEvent.clipboardData!.getData('text/plain'),
        )
        return {insert: [INSERTED_BLOCK]}
      })
      const {editable} = await open(depth, {onPaste: onPaste as never}, 'caret')

      editable.dispatchEvent(clipboardEvent('paste', 'pasted'))

      await waitForDocumentState((state) => documentIncludes(state, `${text}Inserted`))
      expect(received).toEqual(['pasted', 'pasted'])
    })

    it('onPaste returning a promise of undefined falls through to the editor paste exactly once', async () => {
      // A repeated call falls through synchronously so a regression cannot loop forever.
      const onPaste = vi
        .fn<NonNullable<HandlerProps['onPaste']>>()
        .mockReturnValue(undefined)
        .mockResolvedValueOnce(undefined)
      const {editable} = await open(depth, {onPaste}, 'caret')

      editable.dispatchEvent(clipboardEvent('paste', 'async fallback'))

      const state = await waitForDocumentState((value) =>
        documentIncludes(value, `${text}async fallback`),
      )
      expect(JSON.stringify(state).match(/async fallback/g)).toHaveLength(1)
      expect(onPaste).toHaveBeenCalledTimes(1)
    })

    it('onPaste returning undefined falls through to the editor paste', async () => {
      const onPaste = vi.fn(() => undefined)
      const {editable} = await open(depth, {onPaste}, 'caret')

      editable.dispatchEvent(clipboardEvent('paste', 'plain fallback'))

      await waitForDocumentState((state) => documentIncludes(state, `${text}plain fallback`))
      expect(onPaste).toHaveBeenCalledTimes(1)
    })
  })
})
