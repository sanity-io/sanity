import {history, historyField} from '@codemirror/commands'
import {forceParsing} from '@codemirror/language'
import {type EditorState, type Extension, type StateEffect, Transaction} from '@codemirror/state'
import {type Command, type EditorView, type ViewUpdate} from '@codemirror/view'
import {rem, useTheme} from '@sanity/ui'
import CodeMirror, {
  EditorSelection,
  type ReactCodeMirrorProps,
  type ReactCodeMirrorRef,
} from '@uiw/react-codemirror'
import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type RefAttributes,
} from 'react'

import {historyCompartment} from './extensions'
import {useCodemirrorTheme} from './useCodemirrorTheme'
import {getVisibleColumns} from './visibleColumns'
import * as styles from './VisionCodeMirror.module.css'
import {whitespaceChanges} from './whitespaceChanges'

/** How long after a typed edit the editor still counts as being edited */
const EDITING_IDLE_MS = 1_000

interface EditorRootStyle extends CSSProperties {
  '--vision-editor-line-padding-left': string
  '--vision-editor-content-border-right-width': string
  '--vision-editor-content-padding-top': string
}

function EditorRoot({
  autoHeight,
  underHeader,
  children,
}: {
  autoHeight: boolean
  underHeader: boolean
  children: ReactNode
}) {
  const {sanity} = useTheme()
  const style: EditorRootStyle = {
    // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
    '--vision-editor-line-padding-left': `${rem(sanity.space[3])}`,
    // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
    '--vision-editor-content-border-right-width': `${rem(sanity.space[4])}`,
    // The tall top padding makes room for the label floating over a pane-filling editor
    // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
    '--vision-editor-content-padding-top': `${rem(sanity.space[underHeader ? 3 : 5])}`,
  }

  return (
    <div
      className={
        autoHeight ? `${styles.editorRoot} ${styles.editorRootAutoHeight}` : styles.editorRoot
      }
      style={style}
    >
      {children}
    </div>
  )
}

export interface VisionCodeMirrorHandle {
  resetEditorContent: (newContent: string) => void
  /** Edits the document like typing would: undoable, the selection mapped through the edits */
  applyChanges: (changes: readonly {from: number; to: number; insert: string}[]) => void
  /** Runs an editor command, as a key binding would; `false` when it did nothing or there is no editor */
  runCommand: (command: Command) => boolean
  /** Selects a range of the document, scrolls it into view and focuses the editor */
  selectRange: (from: number, to: number) => void
  /**
   * How many characters fit on a line without scrolling sideways, for the document as it is or,
   * with `lines`, as it will be with that many lines (a wider line-number gutter, a vertical
   * scrollbar); `undefined` while the editor has no layout (hidden, or not mounted yet)
   */
  getVisibleColumns: (lines?: number) => number | undefined
  /**
   * Replaces the document with a reformatted version of it, outside the undo history: undo steps
   * over it to the edits made before, which are mapped through it. Only the whitespace that
   * differs is replaced, so the selection stays on the same tokens, and the scroll position
   * follows the text at the top of the editor.
   */
  reformat: (formatted: string) => void
  /** Whether an input method composition is open, or the document was typed into just now */
  isEditing: () => boolean
}

export function VisionCodeMirror({
  ref,
  onChange,
  initialValue: initialValueProp,
  extensions,
  autoHeight = false,
  underHeader = autoHeight,
}: Pick<ReactCodeMirrorProps, 'onChange'> & {
  initialValue: ReactCodeMirrorProps['value']
  extensions: Extension[]
  /**
   * Sizes the editor to its document instead of filling its container, for an editor that sits
   * under a header (so `underHeader` too)
   */
  autoHeight?: boolean
  /**
   * The editor sits under a header rather than under a label floating over it, so its content
   * needs less top padding
   */
  underHeader?: boolean
} & RefAttributes<VisionCodeMirrorHandle>) {
  // While the view is alive its document is the source of truth: the `initialValue` prop only
  // seeded it, edits reach the parent through `onChange`, and parent updates come back through
  // `resetEditorContent`. The document is mirrored into `value` because `@uiw/react-codemirror`
  // destroys its `EditorView` when its effects are cleaned up and creates a new one from `value`
  // when they run again, which happens without a remount when the tool is hidden and shown again
  // inside an `<Activity>` boundary (`reactActivityMode`). While the view is alive `value`
  // always equals its document, so the value sync never dispatches. Without a view the prop
  // leads instead: the handle is detached along with the effects, so a query formatted while the
  // tool is hidden only reaches this component as a new `initialValue`, and the next view must
  // show it rather than the document from before hiding.
  const [value, setValue] = useState(initialValueProp)
  const [liveView, setLiveView] = useState<EditorView | null>(null)
  const hasView = liveView !== null
  const [seenInitialValue, setSeenInitialValue] = useState(initialValueProp)
  if (initialValueProp !== seenInitialValue) {
    setSeenInitialValue(initialValueProp)
    if (!hasView) setValue(initialValueProp)
  }
  // A new view starts with the cursor at the start, no undo history and no scroll. When it shows
  // the document the previous view had, it takes over that view's selection, history and scroll,
  // so a tab shown again looks and undoes as it did when it was hidden. The scroll is recorded as
  // it happens: by the time the view is destroyed its tab is already hidden, with no layout
  const lastState = useRef<EditorState | undefined>(undefined)
  const lastScroll = useRef<StateEffect<unknown> | undefined>(undefined)
  const lastTypedAt = useRef(-Infinity)
  const handleUpdate = useCallback((update: ViewUpdate) => {
    lastState.current = update.state
    if (update.transactions.some((tr) => tr.isUserEvent('input') || tr.isUserEvent('delete'))) {
      lastTypedAt.current = performance.now()
    }
  }, [])
  const handleCreateEditor = useCallback((view: EditorView) => {
    const previous = lastState.current
    lastState.current = view.state
    if (previous && previous.doc.eq(view.state.doc)) {
      const previousHistory = previous.field(historyField, false)
      const keepsHistory =
        previousHistory !== undefined && historyCompartment.get(view.state) !== undefined
      view.dispatch({
        selection: previous.selection,
        annotations: Transaction.addToHistory.of(false),
        effects: keepsHistory ? historyCompartment.reconfigure([]) : [],
      })
      // Taking the history out and putting it back with its old value must be two transactions:
      // in one, the field would keep its current value
      if (keepsHistory) {
        view.dispatch({
          effects: historyCompartment.reconfigure([
            history(),
            historyField.init(() => previousHistory),
          ]),
        })
      }
      if (lastScroll.current) view.dispatch({effects: lastScroll.current})
      // A new state parses only the start of a long document and the rest while idle, so folds
      // that end further down (the gutter's markers) would show up frames after the view; the old
      // view had them all
      forceParsing(view, view.state.doc.length, 50)
    } else {
      lastScroll.current = undefined
    }
    // A new view draws its gutters before it has read the content's top padding, and only lines
    // them up with the text in its first measure, after the browser has painted: the line numbers
    // would show a frame too high, every time a tab mounts its editors. Reading the layout makes
    // the view take that measure now
    view.lineBlockAtHeight(0)
    setLiveView(view)
  }, [])
  useEffect(() => {
    // The view is destroyed by the child's effect cleanups, which run along with this one
    return () => setLiveView(null)
  }, [])

  const handleChange = useCallback<NonNullable<ReactCodeMirrorProps['onChange']>>(
    (nextValue, viewUpdate) => {
      setValue(nextValue)
      onChange?.(nextValue, viewUpdate)
    },
    [onChange],
  )
  const sanityTheme = useTheme()
  const theme = useCodemirrorTheme(sanityTheme)
  const codeMirrorRef = useRef<ReactCodeMirrorRef>(null)
  useEffect(() => {
    if (!liveView) return undefined
    const recordScroll = () => {
      lastScroll.current = liveView.scrollSnapshot()
    }
    liveView.scrollDOM.addEventListener('scroll', recordScroll, {passive: true})
    return () => liveView.scrollDOM.removeEventListener('scroll', recordScroll)
  }, [liveView])

  const resetEditorContent = useCallback((newContent: string) => {
    // Mirrored first, so a call made while there is no view still reaches the next one
    setValue(newContent)
    const editorView = codeMirrorRef.current?.view
    if (!editorView) return

    const currentDoc = editorView.state.doc.toString()
    if (newContent !== currentDoc) {
      editorView.dispatch({
        changes: {from: 0, to: currentDoc.length, insert: newContent},
        selection: EditorSelection.cursor(newContent.length), // Place cursor at end
      })
      // Show the new content from its start; longer lines in the replaced content may have
      // left the editor scrolled sideways
      editorView.scrollDOM.scrollTop = 0
      editorView.scrollDOM.scrollLeft = 0
    }
  }, [])

  const applyChanges = useCallback(
    (changes: readonly {from: number; to: number; insert: string}[]) => {
      codeMirrorRef.current?.view?.dispatch({changes: [...changes], userEvent: 'input'})
    },
    [],
  )

  const runCommand = useCallback((command: Command) => {
    const editorView = codeMirrorRef.current?.view
    return editorView ? command(editorView) : false
  }, [])

  const selectRange = useCallback((from: number, to: number) => {
    const editorView = codeMirrorRef.current?.view
    if (!editorView) return

    const length = editorView.state.doc.length
    editorView.dispatch({
      selection: EditorSelection.range(Math.min(from, length), Math.min(to, length)),
      scrollIntoView: true,
    })
    editorView.focus()
  }, [])

  const getVisibleColumnsOfEditor = useCallback((lines?: number) => {
    const editorView = codeMirrorRef.current?.view
    return editorView ? getVisibleColumns(editorView, {lines}) : undefined
  }, [])

  const reformat = useCallback((formatted: string) => {
    const editorView = codeMirrorRef.current?.view
    if (!editorView) {
      setValue(formatted)
      return
    }
    const changes = whitespaceChanges(editorView.state.doc.toString(), formatted)
    if (changes.length === 0) return
    editorView.dispatch({
      changes,
      annotations: Transaction.addToHistory.of(false),
      effects: editorView.scrollSnapshot(),
    })
  }, [])

  const isEditing = useCallback(() => {
    const editorView = codeMirrorRef.current?.view
    if (!editorView) return false
    return editorView.composing || performance.now() - lastTypedAt.current < EDITING_IDLE_MS
  }, [])

  useImperativeHandle(
    ref,
    () => ({
      resetEditorContent,
      applyChanges,
      runCommand,
      selectRange,
      getVisibleColumns: getVisibleColumnsOfEditor,
      reformat,
      isEditing,
    }),
    [
      resetEditorContent,
      applyChanges,
      runCommand,
      selectRange,
      getVisibleColumnsOfEditor,
      reformat,
      isEditing,
    ],
  )

  return (
    <EditorRoot autoHeight={autoHeight} underHeader={underHeader}>
      <CodeMirror
        ref={codeMirrorRef}
        basicSetup={false}
        theme={theme}
        extensions={extensions}
        value={value}
        onChange={handleChange}
        onCreateEditor={handleCreateEditor}
        onUpdate={handleUpdate}
      />
    </EditorRoot>
  )
}
