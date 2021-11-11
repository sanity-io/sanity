import {ChangeFieldWrapper} from '@sanity/base/change-indicators'
import {
  ChangeList,
  DiffTooltip,
  DocumentChangeContext,
  DocumentChangeContextInstance,
  NoChanges,
  ObjectDiff,
} from '@sanity/field/diff'
import {UserAvatar, ScrollContainer} from '@sanity/base/components'
import {CloseIcon} from '@sanity/icons'
import {AvatarStack, BoundaryElementProvider, Box, Button, Flex} from '@sanity/ui'
import React, {useRef} from 'react'
import styled from 'styled-components'
import {TimelineMenu} from '../timeline'
import {PaneContent, PaneHeader} from '../../../components/pane'
import {usePane} from '../../../components/pane/usePane'
import {useDocumentPane} from '../useDocumentPane'
import {LoadingContent} from './content/LoadingContent'
import {collectLatestAuthorAnnotations} from './helpers'

const Scroller = styled(ScrollContainer)`
  height: 100%;
  overflow: auto;
  position: relative;
  scroll-behavior: smooth;
`

export function ChangesPanel(): React.ReactElement | null {
  const {
    documentId,
    documentSchema,
    handleHistoryClose,
    historyController,
    value,
  } = useDocumentPane()
  const {collapsed} = usePane()
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const historyState = historyController.selectionState
  const loading = historyState === 'loading'
  const since = historyController.sinceTime
  const diff: ObjectDiff | null = historyController.currentObjectDiff()
  const isComparingCurrent = !historyController.onOlderRevision()

  const documentContext: DocumentChangeContextInstance = React.useMemo(
    () => ({
      documentId,
      schemaType: documentSchema,
      FieldWrapper: ChangeFieldWrapper,
      rootDiff: diff,
      isComparingCurrent,
      value,
    }),
    [documentId, documentSchema, diff, isComparingCurrent, value]
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
            onClick={handleHistoryClose}
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
  diff: ObjectDiff | null
  documentContext: DocumentChangeContextInstance
  loading: boolean
}) {
  const {documentSchema} = useDocumentPane()

  if (loading) {
    return <LoadingContent />
  }

  if (!diff) {
    return <NoChanges />
  }

  return (
    <DocumentChangeContext.Provider value={documentContext}>
      <ChangeList diff={diff} schemaType={documentSchema} />
    </DocumentChangeContext.Provider>
  )
}
