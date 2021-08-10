import React from 'react'
import {EditStateFor} from '@sanity/base/lib/datastores/document/document-pair/editState'
import {useEditState} from '@sanity/react-hooks'
import resolveDocumentBadges from 'part:@sanity/base/document-badges/resolver'
import styled from 'styled-components'
import {Box, Card, Flex} from '@sanity/ui'
import {useDocumentHistory} from '../documentHistory'
import {DocumentStatusBarActions, HistoryStatusBarActions} from './documentStatusBarActions'
import {DocumentSparkline} from './documentSparkline'

export interface DocumentStatusBarProps {
  actionsBoxRef?: React.Ref<HTMLDivElement>
  id: string
  type: string
  lastUpdated?: string | null
}

const DocumentActionsBox = styled(Box)`
  min-width: 10em;
  max-width: 16em;
`

export function DocumentStatusBar(props: DocumentStatusBarProps) {
  const {actionsBoxRef, id, lastUpdated, type} = props
  const {historyController} = useDocumentHistory()
  const editState: EditStateFor | null = useEditState(id, type) as any
  const badges = editState ? resolveDocumentBadges(editState) : []
  const showingRevision = historyController.onOlderRevision()
  const revision = historyController.revTime?.id || ''

  return (
    <Card paddingX={[3, 4]} paddingY={[3, 3]}>
      <Flex align="center">
        <Box flex={[1, 2]}>
          <DocumentSparkline badges={badges} editState={editState} lastUpdated={lastUpdated} />
        </Box>

        <DocumentActionsBox flex={1} marginLeft={[1, 3]} ref={actionsBoxRef}>
          {showingRevision ? (
            <HistoryStatusBarActions id={id} type={type} revision={revision} />
          ) : (
            <DocumentStatusBarActions id={id} type={type} />
          )}
        </DocumentActionsBox>
      </Flex>
    </Card>
  )
}
