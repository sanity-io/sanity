import {type Extension} from '@codemirror/state'
import {type Command} from '@codemirror/view'
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

import {useCodemirrorTheme} from './useCodemirrorTheme'
import {getVisibleColumns} from './visibleColumns'
import * as styles from './VisionCodeMirror.module.css'

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
  const handleCreateEditor = useCallback(() => setHasView(true), [])
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
  const codeMirrorRef = useRef<ReactCodeMirrorRef>(null)

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
        ref={codeMirrorRef}
        basicSetup={false}
        theme={theme}
        extensions={extensions}
        value={value}
        onChange={handleChange}
        onCreateEditor={handleCreateEditor}
      />
    </EditorRoot>
  )
}
