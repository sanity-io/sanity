import {Card} from '@sanity/ui'
import {type RefObject, useEffect, useMemo} from 'react'
import {Text} from 'ui5'

import {VisionCodeMirror, type VisionCodeMirrorHandle} from '../../../codemirror/VisionCodeMirror'
import {type Params} from '../../../components/VisionGui'
import {useParamsInference} from '../../hooks/useParamsInference'
import {redesignParamsExtensions} from '../../util/editorTheme'
import {paramsJsonActiveParam} from '../../util/paramHighlight'
import {paramsJsonAutocompletion, paramsJsonInferredParams} from '../../util/paramsJsonCompletions'

export interface ParamsPanelProps {
  value: string
  params: Params
  /** The tab's query, whose params the editor completes */
  query: string
  editorRef: RefObject<VisionCodeMirrorHandle | null>
  onChange: (rawParams: string) => void
  /** The param the cursor is in while the editor has focus, `null` otherwise */
  onActiveParamChange: (name: string | null) => void
}

/**
 * The params editor, as tall as its JSON; the panel around it caps and scrolls it. It completes
 * the params the query uses with values the query accepts, inferred like the params form and the
 * TS/Zod export do, and reports the param the cursor is in. A syntax error shows under the
 * editor, so the editor does not move as it comes and goes while typing.
 */
export function ParamsPanel({
  value,
  params,
  query,
  editorRef,
  onChange,
  onActiveParamChange,
}: ParamsPanelProps) {
  const inference = useParamsInference(query)
  const extensions = useMemo(
    () => [
      ...redesignParamsExtensions,
      paramsJsonActiveParam(onActiveParamChange),
      paramsJsonAutocompletion,
      paramsJsonInferredParams.of(inference.params),
    ],
    [inference.params, onActiveParamChange],
  )
  // An editor that unmounts with focus in it reports no blur
  useEffect(() => () => onActiveParamChange(null), [onActiveParamChange])
  return (
    <div data-testid="vision-params-editor">
      <VisionCodeMirror
        autoHeight
        extensions={extensions}
        initialValue={value}
        onChange={onChange}
        ref={editorRef}
      />
      {params.error && (
        <Card borderTop data-testid="vision-params-error" padding={3} tone="critical">
          <Text size={1} as="div" trim={true} tone="critical">
            {params.error}
          </Text>
        </Card>
      )}
    </div>
  )
}
