<<<<<<< HEAD
// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

=======
>>>>>>> 8b5043e2f0 (refactor(desk-tool): use new pane components in `DocumentPane`)
import {ChangeFieldWrapper} from '@sanity/base/change-indicators'
import {useTimeAgo} from '@sanity/base/hooks'
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
<<<<<<< HEAD
import CloseIcon from 'part:@sanity/base/close-icon'
import {UserAvatar, ScrollContainer, LegacyLayerProvider} from '@sanity/base/components'
import {AvatarStack, BoundaryElementProvider, Button, Flex, Card} from '@sanity/ui'
import React, {useRef} from 'react'
import {useDocumentHistory} from '../documentHistory'
import {TimelineMenu} from '../timeline'
=======
import {UserAvatar, ScrollContainer} from '@sanity/base/components'
import {CloseIcon, SelectIcon} from '@sanity/icons'
import {AvatarStack, BoundaryElementProvider, Box, Button, Flex} from '@sanity/ui'
import React, {useCallback, useRef} from 'react'
import styled from 'styled-components'
import {useDocumentHistory} from '../documentHistory'
import {formatTimelineEventLabel} from '../timeline'
import {PaneContent, PaneHeader} from '../../../components/pane'
import {usePane} from '../../../components/pane/usePane'
>>>>>>> 8b5043e2f0 (refactor(desk-tool): use new pane components in `DocumentPane`)
import {LoadingContent} from './content/loading'
import {collectLatestAuthorAnnotations} from './helpers'

interface ChangesPanelProps {
<<<<<<< HEAD
=======
  changesSinceSelectRef: React.MutableRefObject<HTMLButtonElement | null>
>>>>>>> 8b5043e2f0 (refactor(desk-tool): use new pane components in `DocumentPane`)
  documentId: string
  loading: boolean
  schemaType: ObjectSchemaType
  since: Chunk | null
  timelinePopoverBoundaryElement: HTMLDivElement | null
}
const Scroller = styled(ScrollContainer)`
  height: 100%;
  overflow: auto;
  position: relative;
  scroll-behavior: smooth;
`

export function ChangesPanel({
  documentId,
  loading,
  since,
  schemaType,
  timelinePopoverBoundaryElement,
}: ChangesPanelProps): React.ReactElement | null {
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

<<<<<<< HEAD
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
=======
  // This is needed to stop the ClickOutside-handler (in the Popover) to treat the click
  // as an outside-click.
  const ignoreClickOutside = useCallback((evt: React.MouseEvent<HTMLButtonElement>) => {
    evt.stopPropagation()
  }, [])

  const menuOpen = isTimelineOpen && timelineMode === 'since'

  if (collapsed) {
    return null
  }
>>>>>>> 8b5043e2f0 (refactor(desk-tool): use new pane components in `DocumentPane`)

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
        tabs={
          <Button
            fontSize={1}
            iconRight={SelectIcon}
            mode="bleed"
            onClick={onTimelineOpen}
            onMouseUp={ignoreClickOutside}
            padding={2}
            ref={changesSinceSelectRef}
            selected={isTimelineOpen && timelineMode === 'since'}
            style={{maxWidth: '100%'}}
            text={
              // eslint-disable-next-line no-nested-ternary
              menuOpen ? (
                <>Review changes since</>
              ) : since ? (
                <SinceText since={since} />
              ) : (
                <>Since unknown version</>
              )
            }
          />
        }
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
