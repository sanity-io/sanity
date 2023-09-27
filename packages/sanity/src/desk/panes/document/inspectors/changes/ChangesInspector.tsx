import {ObjectDiff} from '@sanity/diff'
import {AvatarStack, BoundaryElementProvider, Box, Card, Flex} from '@sanity/ui'
import React, {ReactElement, useRef} from 'react'
import styled from 'styled-components'
import {TimelineMenu} from '../../timeline'
import {DocumentInspectorHeader} from '../../documentInspector'
import {LoadingContent} from './LoadingContent'
import {collectLatestAuthorAnnotations} from './helpers'
import {useFormState, useTimelineSelector} from 'sanity/document'
import {
  ChangeFieldWrapper,
  ChangeList,
  DiffTooltip,
  DocumentChangeContext,
  DocumentChangeContextInstance,
  DocumentInspectorProps,
  NoChanges,
  ObjectSchemaType,
  ScrollContainer,
  UserAvatar,
} from 'sanity'

const Scroller = styled(ScrollContainer)`
  height: 100%;
  overflow: auto;
  position: relative;
  scroll-behavior: smooth;
`

export function ChangesInspector(props: DocumentInspectorProps): ReactElement {
  const {onClose} = props
  const {documentId, schemaType, value} = useFormState()
  const scrollRef = useRef<HTMLDivElement | null>(null)

  // Subscribe to external timeline state changes
  const diff = useTimelineSelector((state) => state.diff)
  const {loading, sinceTime, isComparingCurrent} = useTimelineSelector((state) => ({
    isComparingCurrent: !state.onOlderRevision,
    sinceTime: state.sinceTime,
    loading: state.selectionState === 'loading',
  }))

  const documentContext: DocumentChangeContextInstance = React.useMemo(
    () => ({
      documentId,
      schemaType,
      FieldWrapper: ChangeFieldWrapper,
      rootDiff: diff,
      isComparingCurrent,
      value,
    }),
    [documentId, diff, isComparingCurrent, schemaType, value],
  )

  const changeAnnotations = React.useMemo(
    () => (diff ? collectLatestAuthorAnnotations(diff) : []),
    [diff],
  )

  return (
    <Flex data-testid="review-changes-pane" direction="column" height="fill" overflow="hidden">
      <DocumentInspectorHeader
        as="header"
        closeButtonLabel="Close review changes"
        flex="none"
        onClose={onClose}
        title="Review changes"
      >
        <Flex gap={1} padding={3} paddingTop={0} paddingBottom={2}>
          <Box flex={1}>
            <TimelineMenu mode="since" chunk={sinceTime} placement="bottom-start" />
          </Box>

          <Box flex="none">
            <DiffTooltip annotations={changeAnnotations} description="Changes by" portal>
              <AvatarStack maxLength={4} aria-label="Changes by">
                {changeAnnotations.map(({author}) => (
                  <UserAvatar key={author} user={author} />
                ))}
              </AvatarStack>
            </DiffTooltip>
          </Box>
        </Flex>
      </DocumentInspectorHeader>

      <Card flex={1}>
        <BoundaryElementProvider element={scrollRef.current}>
          <Scroller data-ui="Scroller" ref={scrollRef}>
            <Box flex={1} padding={4}>
              <Content
                diff={diff}
                documentContext={documentContext}
                loading={loading}
                schemaType={schemaType}
              />
            </Box>
          </Scroller>
        </BoundaryElementProvider>
      </Card>
    </Flex>
  )
}

function Content({
  error,
  diff,
  documentContext,
  loading,
  schemaType,
}: {
  error?: Error | null
  diff: ObjectDiff<any> | null
  documentContext: DocumentChangeContextInstance
  loading: boolean
  schemaType: ObjectSchemaType
}) {
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
