import {Card} from '@sanity/ui'
import {type RefObject} from 'react'
import {Text} from 'ui5'

import {paramsExtensions} from '../../../codemirror/extensions'
import {VisionCodeMirror, type VisionCodeMirrorHandle} from '../../../codemirror/VisionCodeMirror'
import {type Params} from '../../../components/VisionGui'

export interface ParamsPanelProps {
  value: string
  /** The editor keeps a document per tab */
  tabId: string
  params: Params
  editorRef: RefObject<VisionCodeMirrorHandle | null>
  onChange: (rawParams: string) => void
}

/** The params editor, as tall as its JSON; the panel around it caps and scrolls it */
export function ParamsPanel({value, tabId, params, editorRef, onChange}: ParamsPanelProps) {
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
        extensions={paramsExtensions}
        initialValue={value}
        onChange={onChange}
        ref={editorRef}
        stateKey={tabId}
      />
    </div>
  )
}
