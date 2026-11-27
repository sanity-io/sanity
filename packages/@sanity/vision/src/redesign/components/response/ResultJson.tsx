import {useEffect, useMemo, useRef} from 'react'

import {VisionCodeMirror, type VisionCodeMirrorHandle} from '../../../codemirror/VisionCodeMirror'
import {cx} from '../../util/cx'
import {redesignResultJsonExtensions} from '../../util/editorTheme'
import {stringifyResultJson} from '../../util/stringifyResultJson'
import * as styles from '../redesign.module.css'

/**
 * The result as indented JSON in a read-only editor, so any part of it can be selected and
 * copied as text; objects and arrays fold from the gutter
 */
export function ResultJson(props: {className?: string; id: string; value: unknown}) {
  const editorRef = useRef<VisionCodeMirrorHandle>(null)
  const text = useMemo(() => stringifyResultJson(props.value).text, [props.value])
  // The editor only takes its first document from props; a newer result replaces it
  useEffect(() => {
    editorRef.current?.resetEditorContent(text)
  }, [text])

  return (
    <div
      className={cx(styles.resultJson, props.className)}
      data-testid="vision-result-json"
      id={props.id}
    >
      <VisionCodeMirror
        extensions={redesignResultJsonExtensions}
        initialValue={text}
        ref={editorRef}
        underHeader
      />
    </div>
  )
}
