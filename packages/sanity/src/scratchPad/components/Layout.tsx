import React from 'react'
import {Card} from '@sanity/ui'
import {Pane, PaneContent, PaneLayout} from '../../desk/components'
import {schema} from '../config'
import {ScratchPadAssistant} from './assistant/Assistant'
import {ScratchPadForm} from './Form'

export default function ScratchPadLayout() {
  return (
    <PaneLayout height="fill">
      <Pane id="scratch-pad-input-pane">
        <PaneContent>
          <Card padding={3}>
            <ScratchPadForm schema={schema} />
          </Card>
        </PaneContent>
      </Pane>
      <Pane id="scratch-pad-assistant-pane">
        <PaneContent>
          <Card padding={3}>
            <ScratchPadAssistant />
          </Card>
        </PaneContent>
      </Pane>
    </PaneLayout>
  )
}
