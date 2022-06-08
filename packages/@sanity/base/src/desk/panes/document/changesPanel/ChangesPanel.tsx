import {CloseIcon} from '@sanity/icons'
import {AvatarStack, BoundaryElementProvider, Box, Button, Flex} from '@sanity/ui'
import React, {useRef} from 'react'
import styled from 'styled-components'
import {ObjectDiff} from '@sanity/diff'
import {
  DocumentChangeContextInstance,
  DiffTooltip,
  NoChanges,
  DocumentChangeContext,
  ChangeList,
} from '../../../../field'
import {PaneContent, PaneHeader, usePane} from '../../../components'
import {TimelineMenu} from '../timeline'
import {useDocumentPane} from '../useDocumentPane'
import {ScrollContainer} from '../../../../components/scroll'
import {ChangeFieldWrapper} from '../../../../components/changeIndicators'
import {UserAvatar} from '../../../../components/UserAvatar'
import {collectLatestAuthorAnnotations} from './helpers'
import {LoadingContent} from './content/LoadingContent'

const Scroller = styled(ScrollContainer)`
  height: 100%;
  overflow: auto;
  position: relative;
  scroll-behavior: smooth;
`

export function ChangesPanel(): React.ReactElement | null {
  const {documentId, onHistoryClose, historyController, schemaType, value} = useDocumentPane()
  const {collapsed} = usePane()
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const historyState = historyController.selectionState
  const loading = historyState === 'loading'
  const since = historyController.sinceTime
  const diff: ObjectDiff<any> | null = historyController.currentObjectDiff()
  const isComparingCurrent = !historyController.onOlderRevision()

  const documentContext: DocumentChangeContextInstance = React.useMemo(
    () => ({
      documentId,
      schemaType,
      FieldWrapper: ChangeFieldWrapper,
      rootDiff: diff,
      isComparingCurrent,
      value,
    }),
    [documentId, diff, isComparingCurrent, schemaType, value]
  )

  const changeAnnotations = React.useMemo(
    () => (diff ? collectLatestAuthorAnnotations(diff) : []),
    [diff]
  )

  if (collapsed) {
    return null
  }

  return (
    <Flex
      direction="column"
      flex={1}
      style={{
        borderLeft: '1px dashed var(--card-border-color)',
        overflow: 'hidden',
        minWidth: 320,
      }}
      data-testid="review-changes-pane"
    >
      <PaneHeader
        actions={
          <Button
            icon={CloseIcon}
            mode="bleed"
            onClick={onHistoryClose}
            padding={3}
            title="Hide changes panel"
          />
        }
        subActions={
          changeAnnotations.length > 0 && (
            <Box paddingRight={1}>
              <DiffTooltip
                annotations={changeAnnotations}
                description="Changes by"
                placement="bottom-end"
              >
                <AvatarStack maxLength={4}>
                  {changeAnnotations.map(({author}) => (
                    <UserAvatar key={author} user={author} />
                  ))}
                </AvatarStack>
              </DiffTooltip>
            </Box>
          )
        }
        tabs={<TimelineMenu mode="since" chunk={since} />}
        title="Changes"
      />

      <PaneContent>
        <BoundaryElementProvider element={scrollRef.current}>
          <Scroller data-ui="Scroller" ref={scrollRef}>
            <Box flex={1} padding={4}>
              <Content diff={diff} documentContext={documentContext} loading={loading} />
            </Box>
          </Scroller>
        </BoundaryElementProvider>
      </PaneContent>
    </Flex>
  )
}

function Content({
  diff,
  documentContext,
  loading,
}: {
  diff: ObjectDiff<any> | null
  documentContext: DocumentChangeContextInstance
  loading: boolean
}) {
  const {schemaType} = useDocumentPane()

  if (loading) {
    return <LoadingContent />
  }

  if (!diff) {
    return <NoChanges />
  }

  return (
    <DocumentChangeContext.Provider value={documentContext}>
      <ChangeList diff={diff} schemaType={schemaType} />
    </DocumentChangeContext.Provider>
  )
}
