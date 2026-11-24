import {Card} from '@sanity/ui'
import {type RefObject, useEffect, useMemo} from 'react'
import {Text} from 'ui5'

import {VisionCodeMirror, type VisionCodeMirrorHandle} from '../../../codemirror/VisionCodeMirror'
import {type Params} from '../../../components/VisionGui'
import {redesignParamsExtensions} from '../../util/editorTheme'
import {paramsJsonActiveParam} from '../../util/paramHighlight'

export interface ParamsPanelProps {
  value: string
  params: Params
  editorRef: RefObject<VisionCodeMirrorHandle | null>
  onChange: (rawParams: string) => void
  /** The param the cursor is in while the editor has focus, `null` otherwise */
  onActiveParamChange: (name: string | null) => void
}

/** The params editor, as tall as its JSON; the panel around it caps and scrolls it */
export function ParamsPanel({
  value,
  params,
  editorRef,
  onChange,
  onActiveParamChange,
}: ParamsPanelProps) {
  const extensions = useMemo(
    () => [...redesignParamsExtensions, paramsJsonActiveParam(onActiveParamChange)],
    [onActiveParamChange],
  )
  // An editor that unmounts with focus in it reports no blur
  useEffect(() => () => onActiveParamChange(null), [onActiveParamChange])
  return (
    <div data-testid="vision-params-editor">
      {params.error && (
        <Card borderBottom padding={3} tone="critical">
          <Text size={1} as="div" trim={true} tone="critical">
            {params.error}
          </Text>
        </Card>
      )}
      <VisionCodeMirror
        autoHeight
        extensions={extensions}
        initialValue={value}
        onChange={onChange}
        ref={editorRef}
      />
    </div>
  )
}
