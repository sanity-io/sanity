import {EditorSelection, EditorState} from '@codemirror/state'
import {EditorView} from '@codemirror/view'
import {groq} from '@sanity/lezer-groq'
import {Schema} from '@sanity/schema'
import {LayerProvider, ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {cleanup, fireEvent, render, screen, within} from '@testing-library/react'
import {type ReactNode, type RefObject} from 'react'
import {createPortal} from 'react-dom'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {type VisionCodeMirrorHandle} from '../../codemirror/VisionCodeMirror'
import {ParamsForm} from '../components/request/ParamsForm'
import {PARAM_HIGHLIGHT_CLASS, queryParamHighlight} from '../util/paramHighlight'
import {useParamHighlight} from './useParamHighlight'

const schema = Schema.compile({
  name: 'test',
  types: [{name: 'post', type: 'document', fields: [{name: 'title', type: 'string'}]}],
})

vi.mock('sanity', () => ({
  defineLocalesResources: (_namespace: string, resources: unknown) => resources,
}))
vi.mock(
  'sanity/_dangerously_use_private_internals_that_do_not_follow_semver',
  async (importOriginal) => ({
    ...(await importOriginal()),
    useSchema: () => schema,
  }),
)
vi.mock('sanity/i18n', () => ({
  defineLocaleResourceBundle: (bundle: unknown) => bundle,
  InlineCode: ({children}: {children?: ReactNode}) => <code>{children}</code>,
  useTranslation: () => ({t: (key: string) => key}),
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
const QUERY = '*[_type == "post" && title == $title && body match $search]{"again": $title}'

let view: EditorView | undefined

afterEach(() => {
  cleanup()
  view?.destroy()
  view = undefined
})

function queryEditor(selection: EditorSelection): RefObject<VisionCodeMirrorHandle | null> {
  const editor = new EditorView({
    state: EditorState.create({doc: QUERY, selection, extensions: [groq(), queryParamHighlight]}),
    parent: document.body,
  })
  view = editor
  const handle: VisionCodeMirrorHandle = {
    runCommand: (command) => command(editor),
    resetEditorContent: vi.fn(),
    applyChanges: vi.fn(),
    selectRange: vi.fn(),
    getVisibleColumns: () => undefined,
    reformat: vi.fn(),
    isEditing: () => false,
  }
  return {current: handle}
}

function Harness({queryEditorRef}: {queryEditorRef: RefObject<VisionCodeMirrorHandle | null>}) {
  const {formFocusProps} = useParamHighlight(queryEditorRef)
  return (
    <>
      <div {...formFocusProps}>
        <ParamsForm
          onChange={vi.fn()}
          onSubmit={vi.fn()}
          params={{raw: '{}', parsed: {}, valid: true, error: undefined}}
          query={QUERY}
        />
      </div>
      <button data-testid="outside" type="button">
        outside
      </button>
    </>
  )
}

function marked(): string[] {
  return [...(view?.contentDOM.querySelectorAll(`.${PARAM_HIGHLIGHT_CLASS}`) ?? [])].map(
    (element) => element.textContent ?? '',
  )
}

function input(name: string): HTMLElement {
  return within(screen.getByTestId(`vision-params-form-${name}`)).getByRole('textbox')
}

describe('useParamHighlight with the Params form', () => {
  it('marks the focused param in the query, follows focus, and clears when it leaves', () => {
    const selection = EditorSelection.create([EditorSelection.range(2, 7)])
    render(
      <ThemeProvider theme={theme}>
        <LayerProvider>
          <Harness queryEditorRef={queryEditor(selection)} />
        </LayerProvider>
      </ThemeProvider>,
    )
    expect(marked()).toEqual([])

    fireEvent.focus(input('title'))
    expect(marked()).toEqual(['$title', '$title'])

    fireEvent.blur(input('title'), {relatedTarget: input('search')})
    fireEvent.focus(input('search'))
    expect(marked()).toEqual(['$search'])

    fireEvent.blur(input('search'), {relatedTarget: screen.getByTestId('outside')})
    expect(marked()).toEqual([])

    expect(view?.state.selection.eq(selection)).toBe(true)
    expect(view?.state.doc.toString()).toBe(QUERY)
    expect(view?.hasFocus).toBe(false)
  })

  it("keeps the highlight while focus is in the field's portaled list", () => {
    const selection = EditorSelection.create([EditorSelection.range(2, 7)])
    render(<PortalHarness queryEditorRef={queryEditor(selection)} />)
    const field = screen.getByTestId('type-input')
    const option = screen.getByTestId('type-option')

    fireEvent.focus(field)
    expect(marked()).toEqual(['$title', '$title'])

    // Arrowing into the list blurs the input and focuses the option, outside the field's DOM
    fireEvent.blur(field, {relatedTarget: option})
    expect(marked()).toEqual(['$title', '$title'])

    fireEvent.focus(option)
    expect(marked()).toEqual(['$title', '$title'])

    fireEvent.blur(option, {relatedTarget: screen.getByTestId('outside')})
    expect(marked()).toEqual([])

    expect(view?.state.selection.eq(selection)).toBe(true)
    expect(view?.hasFocus).toBe(false)
  })
})

function PortalHarness({
  queryEditorRef,
}: {
  queryEditorRef: RefObject<VisionCodeMirrorHandle | null>
}) {
  const {formFocusProps} = useParamHighlight(queryEditorRef)
  return (
    <>
      <div {...formFocusProps}>
        <div data-vision-param="title">
          <input aria-owns="title-listbox" data-testid="type-input" />
          {createPortal(
            <div id="title-listbox" role="listbox">
              <button data-testid="type-option" type="button">
                post
              </button>
            </div>,
            document.body,
          )}
        </div>
      </div>
      <button data-testid="outside" type="button">
        outside
      </button>
    </>
  )
}
