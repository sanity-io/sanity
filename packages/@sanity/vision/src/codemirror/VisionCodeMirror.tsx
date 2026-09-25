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
