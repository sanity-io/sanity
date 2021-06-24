import React from 'react'
import {useEditState} from '@sanity/react-hooks'
import resolveDocumentBadges from 'part:@sanity/base/document-badges/resolver'
import styled from 'styled-components'
import {Box, Card, Grid} from '@sanity/ui'
import {useDocumentHistory} from '../documentHistory'
import {DocumentStatusBarActions, HistoryStatusBarActions} from './documentStatusBarActions'
import {DocumentSparkline} from './documentSparkline'
import {DocumentStatusBarProps} from './types'

const StatusBarLayout = styled(Grid)`
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: center;
`

const ActionsWrapper = styled.div`
  position: relative;
  max-width: 15em;
  margin-left: auto;
`

export function DocumentStatusBar(props: DocumentStatusBarProps) {
  const {historyController} = useDocumentHistory()
  const editState = useEditState(props.id, props.type)
  const badges = editState ? resolveDocumentBadges(editState) : []
  const showingRevision = historyController.onOlderRevision()
  const revision = historyController.revTime?.id || ''

  return (
    <Card paddingX={3} paddingY={2}>
      <StatusBarLayout>
        <DocumentSparkline editState={editState} badges={badges} lastUpdated={props.lastUpdated} />
        <Box>
          <ActionsWrapper>
            {showingRevision ? (
              <HistoryStatusBarActions id={props.id} type={props.type} revision={revision} />
            ) : (
              <DocumentStatusBarActions id={props.id} type={props.type} />
            )}
          </ActionsWrapper>
        </Box>
      </StatusBarLayout>
    </Card>
  )
}
