import {historyField} from '@codemirror/commands'
import {type Extension} from '@codemirror/state'
import {type EditorView} from '@codemirror/view'
import {rem, useTheme} from '@sanity/ui'
import CodeMirror, {EditorSelection, type ReactCodeMirrorProps} from '@uiw/react-codemirror'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {
  type ReactNode,
  useCallback,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type RefAttributes,
} from 'react'

import {useCodemirrorTheme} from './useCodemirrorTheme'
import {
  contentBorderRightWidthVar,
  contentPaddingTopVar,
  editorRoot,
  linePaddingLeftVar,
} from './VisionCodeMirror.css'

function EditorRoot({children}: {children: ReactNode}) {
  const {sanity} = useTheme()

  return (
    <div
      className={editorRoot}
      style={assignInlineVars({
        // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
        [linePaddingLeftVar]: `${rem(sanity.space[3])}`,
        // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
        [contentBorderRightWidthVar]: `${rem(sanity.space[4])}`,
        // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
        [contentPaddingTopVar]: `${rem(sanity.space[5])}`,
      })}
    >
      {children}
    </div>
  )
}

export interface VisionCodeMirrorHandle {
  resetEditorContent: (newContent: string) => void
}

/** The state fields that travel with the document and selection when a hidden view is rebuilt */
const HIDDEN_STATE_FIELDS = {history: historyField}

export function VisionCodeMirror({
  ref,
  onChange,
  initialValue: initialValueProp,
  extensions,
}: Pick<ReactCodeMirrorProps, 'onChange'> & {
  initialValue: ReactCodeMirrorProps['value']
  extensions: Extension[]
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
  const viewRef = useRef<EditorView | null>(null)

  // The rebuilt view gets the hidden view's selection, undo history and scroll position back. The
  // snapshot is taken in a layout effect cleanup: on hide those run before the boundary applies
  // `display: none` and before the passive cleanup that destroys the view, so the editor is still
  // laid out. The state goes through the library's `initialState`, which rebuilds it with the
  // extensions current at that time (a theme or extension change while hidden applies on
  // reveal); the scroll snapshot is dispatched once the new view exists.
  const [hiddenState, setHiddenState] = useState<ReactCodeMirrorProps['initialState']>(undefined)
  const hiddenScrollRef = useRef<ReturnType<EditorView['scrollSnapshot']> | null>(null)
  useLayoutEffect(() => {
    return () => {
      const view = viewRef.current
      if (view) {
        hiddenScrollRef.current = view.scrollSnapshot()
        setHiddenState({json: view.state.toJSON(HIDDEN_STATE_FIELDS), fields: HIDDEN_STATE_FIELDS})
        viewRef.current = null
      }
    }
  }, [])
  const handleCreateEditor = useCallback((view: EditorView) => {
    viewRef.current = view
    const scroll = hiddenScrollRef.current
    if (!scroll) return
    hiddenScrollRef.current = null
    view.dispatch({effects: scroll})
  }, [])

  const resetEditorContent = useCallback((newContent: string) => {
    const editorView = viewRef.current
    if (!editorView) return

    const currentDoc = editorView.state.doc.toString()
    if (newContent !== currentDoc) {
      editorView.dispatch({
        changes: {from: 0, to: currentDoc.length, insert: newContent},
        selection: EditorSelection.cursor(newContent.length), // Place cursor at end
      })
    }
  }, [])

  useImperativeHandle(
    ref,
    () => ({
      resetEditorContent,
    }),
    [resetEditorContent],
  )

  return (
    <EditorRoot>
      <CodeMirror
        basicSetup={false}
        theme={theme}
        extensions={extensions}
        value={value}
        onChange={handleChange}
        onCreateEditor={handleCreateEditor}
        initialState={hiddenState}
      />
    </EditorRoot>
  )
}
