// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

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
import CloseIcon from 'part:@sanity/base/close-icon'
import {UserAvatar, ScrollContainer, LegacyLayerProvider} from '@sanity/base/components'
import {AvatarStack, BoundaryElementProvider, Button, Flex, Card} from '@sanity/ui'
import React, {useRef} from 'react'
import {useDocumentHistory} from '../documentHistory'
import {TimelineMenu} from '../timeline'
import {LoadingContent} from './content/loading'
import {collectLatestAuthorAnnotations} from './helpers'

import styles from './changesPanel.css'

interface ChangesPanelProps {
  documentId: string
  loading: boolean
  schemaType: ObjectSchemaType
  since: Chunk | null
  timelinePopoverBoundaryElement: HTMLDivElement | null
}

export function ChangesPanel({
  documentId,
  loading,
  since,
  schemaType,
  timelinePopoverBoundaryElement,
}: ChangesPanelProps): React.ReactElement | null {
  const scrollRef = useRef<HTMLElement | null>(null)
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

  return (
    <Card className={styles.root}>
      <Flex direction="column" height="fill">
        <header className={styles.header}>
          <div className={styles.mainNav}>
            <h2 className={styles.title}>Changes</h2>
            <div className={styles.closeButtonContainer}>
              <Button
                icon={CloseIcon}
                mode="bleed"
                onClick={closeHistory}
                padding={2}
                title="Hide changes panel"
              />
            </div>
          </div>

          <div className={styles.versionSelectContainer}>
            <div className={styles.changesSinceSelectContainer}>
              <BoundaryElementProvider element={timelinePopoverBoundaryElement}>
                <LegacyLayerProvider zOffset="paneHeader">
                  <TimelineMenu mode="since" chunk={since} />
                </LegacyLayerProvider>
              </BoundaryElementProvider>
            </div>

            {changeAnnotations.length > 0 && (
              <DiffTooltip
                annotations={changeAnnotations}
                description="Changes by"
                placement="bottom-end"
                fallbackPlacements={['top-end', 'bottom-end']}
              >
                <AvatarStack maxLength={4}>
                  {changeAnnotations.map(({author}) => (
                    <UserAvatar key={author} userId={author} />
                  ))}
                </AvatarStack>
              </DiffTooltip>
            )}
          </div>
        </header>
        <BoundaryElementProvider element={scrollRef.current}>
          <ScrollContainer className={styles.body} ref={scrollRef}>
            <Content
              diff={diff}
              documentContext={documentContext}
              loading={loading}
              schemaType={schemaType}
            />
          </ScrollContainer>
        </BoundaryElementProvider>
      </Flex>
    </Card>
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
