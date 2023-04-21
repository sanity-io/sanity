import {ObjectDiff} from '@sanity/diff'
import {CloseIcon} from '@sanity/icons'
import {AvatarStack, BoundaryElementProvider, Box, Button, Flex} from '@sanity/ui'
import React, {useRef} from 'react'
import styled from 'styled-components'
import {PaneContent, PaneHeader, usePane} from '../../../components'
import {TimelineMenu} from '../timeline'
import {useDocumentPane} from '../useDocumentPane'
import {LoadingContent} from './content/LoadingContent'
import {collectLatestAuthorAnnotations} from './helpers'
import {
  ChangeFieldWrapper,
  ChangeList,
  DiffTooltip,
  DocumentChangeContext,
  DocumentChangeContextInstance,
  NoChanges,
  ScrollContainer,
  UserAvatar,
  useTimelineSelector,
} from 'sanity'

const Scroller = styled(ScrollContainer)`
  height: 100%;
  overflow: auto;
  position: relative;
  scroll-behavior: smooth;
`

export function ChangesPanel(): React.ReactElement | null {
  const {documentId, onHistoryClose, schemaType, timelineError, timelineStore, value} =
    useDocumentPane()
  const {collapsed} = usePane()
  const scrollRef = useRef<HTMLDivElement | null>(null)

  // Subscribe to external timeline state changes
  const diff = useTimelineSelector(timelineStore, (state) => state.diff)
  const onOlderRevision = useTimelineSelector(timelineStore, (state) => state.onOlderRevision)
  const selectionState = useTimelineSelector(timelineStore, (state) => state.selectionState)
  const sinceTime = useTimelineSelector(timelineStore, (state) => state.sinceTime)
  const loading = selectionState === 'loading'
  const isComparingCurrent = !onOlderRevision

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
        tabs={<TimelineMenu mode="since" chunk={sinceTime} placement="bottom-start" />}
        title="Changes"
      />

      <PaneContent>
        <BoundaryElementProvider element={scrollRef.current}>
          <Scroller data-ui="Scroller" ref={scrollRef}>
            <Box flex={1} padding={4}>
              <Content
                diff={diff}
                documentContext={documentContext}
                error={timelineError}
                loading={loading}
              />
            </Box>
          </Scroller>
        </BoundaryElementProvider>
      </PaneContent>
    </Flex>
  )
}

function Content({
  error,
  diff,
  documentContext,
  loading,
}: {
  error?: Error | null
  diff: ObjectDiff<any> | null
  documentContext: DocumentChangeContextInstance
  loading: boolean
}) {
  const {schemaType} = useDocumentPane()

  if (error) {
    return <NoChanges />
  }

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
