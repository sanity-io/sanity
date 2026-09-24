import {Card, Label, Text} from '@sanity/ui'
import debounce from 'lodash-es/debounce.js'
import {type RefObject, useEffect, useMemo} from 'react'
import {useTranslation} from 'sanity'
import {Box, Flex} from 'ui5'

import {paramsExtensions} from '../../../codemirror/extensions'
import {VisionCodeMirror, type VisionCodeMirrorHandle} from '../../../codemirror/VisionCodeMirror'
import {type Params} from '../../../components/VisionGui'
import {visionLocaleNamespace} from '../../../i18n'
import {editorContainer, editorLabel} from '../vista.css'

const PARAMS_DEBOUNCE_MS = 333

export interface ParamsTabProps {
  value: string
  params: Params
  editorRef: RefObject<VisionCodeMirrorHandle | null>
  onChange: (rawParams: string) => void
}

export function ParamsTab({value, params, editorRef, onChange}: ParamsTabProps) {
  const {t} = useTranslation(visionLocaleNamespace)
  // Params are parsed on every change, so typing is debounced like in the classic tool
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
        <Box className={editorLabel}>
          <Label muted size={1}>
            {t('params.label')}
          </Label>
        </Box>
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
