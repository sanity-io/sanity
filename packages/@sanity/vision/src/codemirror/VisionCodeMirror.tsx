import {historyField} from '@codemirror/commands'
import {type Extension} from '@codemirror/state'
import {type Command, type EditorView} from '@codemirror/view'
import {rem, useTheme} from '@sanity/ui'
import CodeMirror, {EditorSelection, type ReactCodeMirrorProps} from '@uiw/react-codemirror'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {
  type ReactNode,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type RefAttributes,
} from 'react'

import {useCodemirrorTheme} from './useCodemirrorTheme'
import {getVisibleColumns} from './visibleColumns'
import {
  contentBorderRightWidthVar,
  contentPaddingTopVar,
  editorRoot,
  editorRootAutoHeight,
  linePaddingLeftVar,
} from './VisionCodeMirror.css'

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

  return (
    <div
      className={autoHeight ? `${editorRoot} ${editorRootAutoHeight}` : editorRoot}
      style={assignInlineVars({
        // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
        [linePaddingLeftVar]: `${rem(sanity.space[3])}`,
        // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
        [contentBorderRightWidthVar]: `${rem(sanity.space[4])}`,
        // The tall top padding makes room for the label floating over a pane-filling editor
        // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
        [contentPaddingTopVar]: `${rem(sanity.space[underHeader ? 3 : 5])}`,
      })}
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
}

/** The state fields that travel with the document and selection when a hidden view is rebuilt */
const HIDDEN_STATE_FIELDS = {history: historyField}

/** What a view that is destroyed because the tool is hidden leaves for the view that replaces it */
interface HiddenView {
  state: NonNullable<ReactCodeMirrorProps['initialState']>
  scroll: ReturnType<EditorView['scrollSnapshot']>
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
  // inside an `<Activity>` boundary (`beta.reactActivityMode`). While the view is alive `value`
  // always equals its document, so the value sync never dispatches. Without a view the prop
  // leads instead: the handle is detached along with the effects, so a query formatted while the
  // tool is hidden only reaches this component as a new `initialValue`, and the next view must
  // show it rather than the document from before hiding.
  const [value, setValue] = useState(initialValueProp)
  const [hasView, setHasView] = useState(false)
  const [seenInitialValue, setSeenInitialValue] = useState(initialValueProp)
  if (initialValueProp !== seenInitialValue) {
    setSeenInitialValue(initialValueProp)
    if (!hasView) setValue(initialValueProp)
  }
  useEffect(() => {
    // The view is destroyed by the child's effect cleanups, which run along with this one
    return () => setHasView(false)
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
  const viewRef = useRef<EditorView | null>(null)

  // The view that replaces a hidden one gets its selection, undo history and scroll position
  // back. The snapshot is taken in a layout effect cleanup: on hide those run before the boundary
  // applies `display: none` and before the passive cleanup that destroys the view, so the editor
  // is still laid out. The state goes through the library's `initialState`, which rebuilds it
  // with the extensions current at that time (a theme or extension change while hidden applies
  // on reveal); the scroll snapshot is dispatched once the new view exists. The snapshot only
  // applies while it still describes the document: once `value` has moved on without a view (an
  // `initialValue` that changed while hidden), the new view shows that document from the start.
  const [hidden, setHidden] = useState<HiddenView | undefined>(undefined)
  const restored = hidden?.state.json.doc === value ? hidden : undefined
  useLayoutEffect(() => {
    return () => {
      const view = viewRef.current
      if (view) {
        setHidden({
          state: {json: view.state.toJSON(HIDDEN_STATE_FIELDS), fields: HIDDEN_STATE_FIELDS},
          scroll: view.scrollSnapshot(),
        })
        viewRef.current = null
      }
    }
  }, [])
  const handleCreateEditor = useCallback(
    (view: EditorView) => {
      viewRef.current = view
      setHasView(true)
      if (restored) view.dispatch({effects: restored.scroll})
    },
    [restored],
  )

  const resetEditorContent = useCallback((newContent: string) => {
    // Mirrored first, so a call made while there is no view still reaches the next one
    setValue(newContent)
    const editorView = viewRef.current
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
      viewRef.current?.dispatch({changes: [...changes], userEvent: 'input'})
    },
    [],
  )

  const runCommand = useCallback((command: Command) => {
    const editorView = viewRef.current
    return editorView ? command(editorView) : false
  }, [])

  const selectRange = useCallback((from: number, to: number) => {
    const editorView = viewRef.current
    if (!editorView) return

    const length = editorView.state.doc.length
    editorView.dispatch({
      selection: EditorSelection.range(Math.min(from, length), Math.min(to, length)),
      scrollIntoView: true,
    })
    editorView.focus()
  }, [])

  const getVisibleColumnsOfEditor = useCallback((lines?: number) => {
    const editorView = viewRef.current
    return editorView ? getVisibleColumns(editorView, {lines}) : undefined
  }, [])

  useImperativeHandle(
    ref,
    () => ({
      resetEditorContent,
      applyChanges,
      runCommand,
      selectRange,
      getVisibleColumns: getVisibleColumnsOfEditor,
    }),
    [resetEditorContent, applyChanges, runCommand, selectRange, getVisibleColumnsOfEditor],
  )

  return (
    <EditorRoot autoHeight={autoHeight} underHeader={underHeader}>
      <CodeMirror
        basicSetup={false}
        theme={theme}
        extensions={extensions}
        value={value}
        onChange={handleChange}
        onCreateEditor={handleCreateEditor}
        initialState={restored?.state}
      />
    </EditorRoot>
  )
}
