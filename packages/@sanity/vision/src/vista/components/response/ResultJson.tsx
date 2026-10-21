import {useEffect, useMemo, useRef} from 'react'

import {resultJsonExtensions} from '../../../codemirror/extensions'
import {VisionCodeMirror, type VisionCodeMirrorHandle} from '../../../codemirror/VisionCodeMirror'
import styles from '../vista.module.css'

/**
 * The result as indented JSON in a read-only editor, so any part of it can be selected and
 * copied as text; objects and arrays fold from the gutter
 */
export function ResultJson(props: {id: string; value: unknown}) {
  const editorRef = useRef<VisionCodeMirrorHandle>(null)
  const text = useMemo(() => JSON.stringify(props.value, null, 2) ?? 'null', [props.value])
  // The editor only takes its first document from props; a newer result replaces it
  useEffect(() => {
    editorRef.current?.resetEditorContent(text)
  }, [text])

  return (
    <div className={styles.resultJson} data-testid="vista-result-json" id={props.id}>
      <VisionCodeMirror extensions={resultJsonExtensions} initialValue={text} ref={editorRef} />
    </div>
  )
}
