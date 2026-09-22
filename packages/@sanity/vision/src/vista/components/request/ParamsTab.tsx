import {Card, Text} from '@sanity/ui'
import debounce from 'lodash-es/debounce.js'
import {type RefObject, useEffect, useMemo} from 'react'
import {Box, Flex} from 'ui5'

import {paramsExtensions} from '../../../codemirror/extensions'
import {VisionCodeMirror, type VisionCodeMirrorHandle} from '../../../codemirror/VisionCodeMirror'
import {type Params} from '../../../components/VisionGui'
import {editorContainer} from '../vista.css'

const PARAMS_DEBOUNCE_MS = 333

export interface ParamsTabProps {
  value: string
  params: Params
  editorRef: RefObject<VisionCodeMirrorHandle | null>
  onChange: (rawParams: string) => void
}

export function ParamsTab({value, params, editorRef, onChange}: ParamsTabProps) {
  // Params are parsed on every change, so typing is debounced like in Vision
  const handleChange = useMemo(() => debounce(onChange, PARAMS_DEBOUNCE_MS), [onChange])
  useEffect(() => () => handleChange.flush(), [handleChange])

  return (
    <Flex data-testid="vista-params-editor" flexDirection="column" height="100%">
      {params.error && (
        <Card borderBottom padding={3} tone="critical">
          <Text size={1}>{params.error}</Text>
        </Card>
      )}
      <Box className={editorContainer} flexBasis="0%" flexGrow={1}>
        <VisionCodeMirror
          extensions={paramsExtensions}
          initialValue={value}
          onChange={handleChange}
          ref={editorRef}
        />
      </Box>
    </Flex>
  )
}
