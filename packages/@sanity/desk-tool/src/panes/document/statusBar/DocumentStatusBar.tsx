import React from 'react'
import styled from 'styled-components'
import {Box, Flex} from '@sanity/ui'
import {useDocumentHistory} from '../documentHistory'
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
  const {badges} = useDocumentPane()
  const {historyController} = useDocumentHistory()
  const showingRevision = historyController.onOlderRevision()

  return (
    <Box paddingLeft={3} paddingRight={[3, 4]} paddingY={[3, 3]}>
      <Flex align="center">
        <Box flex={[1, 2]}>{badges && <DocumentSparkline />}</Box>

        <DocumentActionsBox flex={1} marginLeft={[1, 3]} ref={actionsBoxRef}>
          {showingRevision ? <HistoryStatusBarActions /> : <DocumentStatusBarActions />}
        </DocumentActionsBox>
      </Flex>
    </Box>
  )
}
