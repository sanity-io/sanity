import {type Extension} from '@codemirror/state'
import {rem, useTheme} from '@sanity/ui'
import CodeMirror, {
  EditorSelection,
  type ReactCodeMirrorProps,
  type ReactCodeMirrorRef,
} from '@uiw/react-codemirror'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {
  type ReactNode,
  useCallback,
  useImperativeHandle,
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

function EditorRoot({autoHeight, children}: {autoHeight: boolean; children: ReactNode}) {
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
        [contentPaddingTopVar]: `${rem(sanity.space[autoHeight ? 3 : 5])}`,
      })}
    >
      {children}
    </div>
  )
}

export interface VisionCodeMirrorHandle {
  resetEditorContent: (newContent: string) => void
  /** Selects a range of the document, scrolls it into view and focuses the editor */
  selectRange: (from: number, to: number) => void
  /**
   * How many characters fit on a line right now without scrolling sideways; `undefined` while
   * the editor has no layout (hidden, or not mounted yet)
   */
  getVisibleColumns: () => number | undefined
}

export function VisionCodeMirror({
  ref,
  onChange,
  initialValue: initialValueProp,
  extensions,
  autoHeight = false,
}: Pick<ReactCodeMirrorProps, 'onChange'> & {
  initialValue: ReactCodeMirrorProps['value']
  extensions: Extension[]
  /**
   * Sizes the editor to its document instead of filling its container, for an editor that sits
   * under a header (no floating label, so the content also gets less top padding)
   */
  autoHeight?: boolean
} & RefAttributes<VisionCodeMirrorHandle>) {
  // The `initialValue` prop only seeds the editor; later parent updates go through
  // `resetEditorContent`. The latest document is still mirrored into state because
  // `@uiw/react-codemirror` destroys its `EditorView` when its effects are cleaned up and rebuilds
  // it from `value` when they run again, which happens without a remount when the tool is hidden
  // and shown again inside an `<Activity>` boundary (`beta.reactActivityMode`). While the
  // view is alive `value` always equals its document, so the value sync never dispatches.
  const [value, setValue] = useState(initialValueProp)
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

  const getVisibleColumnsOfEditor = useCallback(() => {
    const editorView = codeMirrorRef.current?.view
    return editorView ? getVisibleColumns(editorView) : undefined
  }, [])

  useImperativeHandle(
    ref,
    () => ({
      resetEditorContent,
      selectRange,
      getVisibleColumns: getVisibleColumnsOfEditor,
    }),
    [resetEditorContent, selectRange, getVisibleColumnsOfEditor],
  )

  return (
    <EditorRoot autoHeight={autoHeight}>
      <CodeMirror
        ref={codeMirrorRef}
        basicSetup={false}
        theme={theme}
        extensions={extensions}
        value={value}
        onChange={handleChange}
      />
    </EditorRoot>
  )
}
