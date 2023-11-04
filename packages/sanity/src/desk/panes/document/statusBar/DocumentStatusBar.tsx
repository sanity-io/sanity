import React, {useMemo} from 'react'
import styled from 'styled-components'
import {Box, Flex} from '@sanity/ui'
import {useDocumentPane} from '../useDocumentPane'
import {DocumentStatusBarActions, HistoryStatusBarActions} from './DocumentStatusBarActions'
import {DocumentSparkline} from './sparkline/DocumentSparkline'
import {useTimelineSelector} from 'sanity'

export interface DocumentStatusBarProps {
  actionsBoxRef?: React.Ref<HTMLDivElement>
}

const DocumentActionsBox = styled(Box)`
  min-width: 10em;
  max-width: 16em;
`

export function DocumentStatusBar(props: DocumentStatusBarProps) {
  const {actionsBoxRef} = props
  const {badges, timelineStore} = useDocumentPane()

  // Subscribe to external timeline state changes
  const showingRevision = useTimelineSelector(timelineStore, (state) => state.onOlderRevision)

  return useMemo(
    () => (
      <Box padding={2}>
        <Flex align="center">
          <Box flex={[1, 2]}>{badges && <DocumentSparkline />}</Box>

          <DocumentActionsBox flex={1} marginLeft={[1, 3]} ref={actionsBoxRef}>
            {showingRevision ? <HistoryStatusBarActions /> : <DocumentStatusBarActions />}
          </DocumentActionsBox>
        </Flex>
      </Box>
    ),
    [actionsBoxRef, badges, showingRevision],
  )
}
