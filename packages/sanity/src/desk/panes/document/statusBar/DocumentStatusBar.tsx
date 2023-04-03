import React, {useEffect, useMemo, useState} from 'react'
import styled from 'styled-components'
import {Box, Flex} from '@sanity/ui'
import {useDocumentPane} from '../useDocumentPane'
import {DocumentStatusBarActions, HistoryStatusBarActions} from './DocumentStatusBarActions'
import {DocumentSparkline} from './sparkline/DocumentSparkline'

export interface DocumentStatusBarProps {
  actionsBoxRef?: React.Ref<HTMLDivElement>
}

const DocumentActionsBox = styled(Box)`
  min-width: 10em;
  max-width: 16em;
`

export function DocumentStatusBar(props: DocumentStatusBarProps) {
  const {actionsBoxRef} = props
  const {badges, timelineController$} = useDocumentPane()

  // Subscribe to TimelineController changes and store internal state.
  const [showingRevision, setShowingRevision] = useState(false)
  useEffect(() => {
    const subscription = timelineController$.subscribe((controller) => {
      setShowingRevision(controller.onOlderRevision())
    })
    return () => subscription.unsubscribe()
  }, [timelineController$])

  return useMemo(
    () => (
      <Box paddingLeft={2} paddingRight={[2, 3]} paddingY={2}>
        <Flex align="center">
          <Box flex={[1, 2]}>{badges && <DocumentSparkline />}</Box>

          <DocumentActionsBox flex={1} marginLeft={[1, 3]} ref={actionsBoxRef}>
            {showingRevision ? <HistoryStatusBarActions /> : <DocumentStatusBarActions />}
          </DocumentActionsBox>
        </Flex>
      </Box>
    ),
    [actionsBoxRef, badges, showingRevision]
  )
}
