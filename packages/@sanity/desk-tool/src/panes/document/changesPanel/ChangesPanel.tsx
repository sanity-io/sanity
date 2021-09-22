import {ChangeFieldWrapper} from '@sanity/base/change-indicators'
import {
  ChangeList,
  Chunk,
  DiffTooltip,
  DocumentChangeContext,
  DocumentChangeContextInstance,
  NoChanges,
  ObjectDiff,
  ObjectSchemaType,
} from '@sanity/field/diff'
import {UserAvatar, ScrollContainer} from '@sanity/base/components'
import {CloseIcon} from '@sanity/icons'
import {AvatarStack, BoundaryElementProvider, Box, Button, Flex} from '@sanity/ui'
import React, {useRef} from 'react'
import styled from 'styled-components'
import {useDocumentHistory} from '../documentHistory'
import {TimelineMenu} from '../timeline'
import {PaneContent, PaneHeader} from '../../../components/pane'
import {usePane} from '../../../components/pane/usePane'
import {LoadingContent} from './content/LoadingContent'
import {collectLatestAuthorAnnotations} from './helpers'

interface ChangesPanelProps {
  documentId: string
  loading: boolean
  schemaType: ObjectSchemaType
  since: Chunk | null
}

const Scroller = styled(ScrollContainer)`
  height: 100%;
  overflow: auto;
  position: relative;
  scroll-behavior: smooth;
`

export function ChangesPanel(props: ChangesPanelProps): React.ReactElement | null {
  const {documentId, loading, since, schemaType} = props
  const {collapsed} = usePane()
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const {close: closeHistory, historyController} = useDocumentHistory()
  const diff: ObjectDiff | null = historyController.currentObjectDiff()
  const isComparingCurrent = !historyController.onOlderRevision()

  const documentContext: DocumentChangeContextInstance = React.useMemo(
    () => ({
      documentId,
      schemaType,
      FieldWrapper: ChangeFieldWrapper,
      rootDiff: diff,
      isComparingCurrent,
    }),
    [documentId, schemaType, diff, isComparingCurrent]
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
    >
      <PaneHeader
        actions={
          <Button
            icon={CloseIcon}
            mode="bleed"
            onClick={closeHistory}
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
                    <UserAvatar key={author} userId={author} />
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
              <Content
                diff={diff}
                documentContext={documentContext}
                loading={loading}
                schemaType={schemaType}
              />
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
  schemaType,
}: {
  diff: ObjectDiff | null
  documentContext: DocumentChangeContextInstance
  loading: boolean
  schemaType: ObjectSchemaType
}) {
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
