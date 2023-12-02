import React, {useMemo} from 'react'
import styled from 'styled-components'
import {Box, Flex} from '@sanity/ui'
import {useDocumentPane} from '../useDocumentPane'
import {DocumentStatusBarActions, HistoryStatusBarActions} from './DocumentStatusBarActions'
import {DocumentSparkline} from './sparkline/DocumentSparkline'
import {useTimelineSelector} from 'sanity'
import {Button} from '../../../../ui'

export interface DocumentStatusBarProps {
  actionsBoxRef?: React.Ref<HTMLDivElement>
}

const DocumentActionsFlex = styled(Flex)`
  min-width: 10em;
  max-width: 16em;
`

// This Hidden button prevents this status bar from shifting in height as both
// <HistoryStatusBarActions /> and <DocumentStatusBarActions /> can return null.
const SpacerButton = styled(Button)`
  pointer-events: none;
  visibility: hidden;
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

          <DocumentActionsFlex flex={1} justify="flex-end" marginLeft={[1, 3]} ref={actionsBoxRef}>
            <SpacerButton aria-hidden disabled size="large" text="-" />

            {showingRevision ? <HistoryStatusBarActions /> : <DocumentStatusBarActions />}
          </DocumentActionsFlex>
        </Flex>
      </Box>
    ),
    [actionsBoxRef, badges, showingRevision],
  )
}
