import React, {useMemo} from 'react'
import {Flex} from '@sanity/ui'
import {SpacerButton} from '../../../../ui/spacerButton'
import {useDocumentPane} from '../useDocumentPane'
import {DocumentStatusBarActions, HistoryStatusBarActions} from './DocumentStatusBarActions'
import {DocumentSparkline} from './sparkline/DocumentSparkline'
import {useTimelineSelector} from 'sanity'

export interface DocumentStatusBarProps {
  actionsBoxRef?: React.Ref<HTMLDivElement>
}

export function DocumentStatusBar(props: DocumentStatusBarProps) {
  const {actionsBoxRef} = props
  const {timelineStore} = useDocumentPane()

  // Subscribe to external timeline state changes
  const showingRevision = useTimelineSelector(timelineStore, (state) => state.onOlderRevision)

  return useMemo(
    () => (
      <Flex align="center" gap={1} justify="space-between" padding={2}>
        <DocumentSparkline />

        <Flex justify="flex-end" ref={actionsBoxRef} style={{flexShrink: 0, marginLeft: 'auto'}}>
          <SpacerButton size="large" />
          {showingRevision ? <HistoryStatusBarActions /> : <DocumentStatusBarActions />}
        </Flex>
      </Flex>
    ),
    [actionsBoxRef, showingRevision],
  )
}
