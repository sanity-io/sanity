import React, {useMemo} from 'react'
import styled from 'styled-components'
import {Box, Flex} from '@sanity/ui'
import {SpacerButton} from '../../../../ui/spacerButton'
import {useDocumentPane} from '../useDocumentPane'
import {DocumentStatusBarActions, HistoryStatusBarActions} from './DocumentStatusBarActions'
import {DocumentSparkline} from './sparkline/DocumentSparkline'
import {useTimelineSelector} from 'sanity'

export interface DocumentStatusBarProps {
  actionsBoxRef?: React.Ref<HTMLDivElement>
}

const DocumentActionsFlex = styled(Flex)`
  min-width: 10em;
  max-width: 16em;
`

export function DocumentStatusBar(props: DocumentStatusBarProps) {
  const {actionsBoxRef} = props
  const {timelineStore} = useDocumentPane()

  // Subscribe to external timeline state changes
  const showingRevision = useTimelineSelector(timelineStore, (state) => state.onOlderRevision)

  return useMemo(
    () => (
      <Flex align="center" gap={1} padding={2} paddingLeft={3}>
        <Box flex={[1, 2]}>
          <DocumentSparkline />
        </Box>

        <DocumentActionsFlex flex={1} justify="flex-end" ref={actionsBoxRef}>
          <SpacerButton size="large" />
          {showingRevision ? <HistoryStatusBarActions /> : <DocumentStatusBarActions />}
        </DocumentActionsFlex>
      </Flex>
    ),
    [actionsBoxRef, showingRevision],
  )
}
