import {useTimeAgo} from '@sanity/base/hooks'
import {ChangeFieldWrapper} from '@sanity/base/lib/change-indicators/ChangeFieldWrapper'
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
import {UserAvatar, ScrollContainer} from '@sanity/base/components'
import Button from 'part:@sanity/components/buttons/default'
import {AvatarStack} from 'part:@sanity/components/avatar'
import {TooltipProvider} from 'part:@sanity/components/tooltip'
import React, {useCallback, useRef} from 'react'
import {DropdownButton} from '../../../components/DropdownButton'
import {useDocumentHistory} from '../documentHistory'
import {formatTimelineEventLabel} from '../timeline'
import {LoadingContent} from './content/loading'
import {collectLatestAuthorAnnotations} from './helpers'

import styles from './changesPanel.css'

interface ChangesPanelProps {
  changesSinceSelectRef: React.MutableRefObject<HTMLDivElement | null>
  documentId: string
  isTimelineOpen: boolean
  loading: boolean
  onTimelineOpen: () => void
  schemaType: ObjectSchemaType
  since: Chunk | null
  timelineMode: 'rev' | 'since' | 'closed'
}

export function ChangesPanel({
  changesSinceSelectRef,
  documentId,
  isTimelineOpen,
  loading,
  onTimelineOpen,
  since,
  schemaType,
  timelineMode,
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

  // This is needed to stop the ClickOutside-handler (in the Popover) to treat the click
  // as an outside-click.
  const ignoreClickOutside = useCallback((evt: React.MouseEvent<HTMLButtonElement>) => {
    evt.stopPropagation()
  }, [])

  const menuOpen = isTimelineOpen && timelineMode === 'since'

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.mainNav}>
          <h2 className={styles.title}>Changes</h2>
          <div className={styles.closeButtonContainer}>
            <Button
              icon={CloseIcon}
              kind="simple"
              onClick={closeHistory}
              padding="small"
              title="Hide changes panel"
              type="button"
            />
          </div>
        </div>

        <div className={styles.versionSelectContainer}>
          <div className={styles.changesSinceSelectContainer}>
            <div ref={changesSinceSelectRef}>
              <DropdownButton
                onMouseUp={ignoreClickOutside}
                onClick={onTimelineOpen}
                selected={isTimelineOpen && timelineMode === 'since'}
              >
                {/* eslint-disable-next-line no-nested-ternary */}
                {menuOpen ? (
                  <>Review changes since</>
                ) : since ? (
                  <SinceText since={since} />
                ) : (
                  <>Since unknown version</>
                )}
              </DropdownButton>
            </div>
          </div>

          {changeAnnotations.length > 0 && (
            <DiffTooltip
              annotations={changeAnnotations}
              description="Changes by"
              placement="bottom"
            >
              <div className={styles.changeAuthorsContainer}>
                <AvatarStack className={styles.changeAuthorsAvatarStack} maxLength={4}>
                  {changeAnnotations.map(({author}) => (
                    <UserAvatar
                      key={author}
                      userId={author}
                      // position="bottom"
                    />
                  ))}
                </AvatarStack>
              </div>
            </DiffTooltip>
          )}
        </div>
      </header>
      <TooltipProvider boundaryElement={scrollRef.current}>
        <ScrollContainer className={styles.body} ref={scrollRef}>
          <Content
            diff={diff}
            documentContext={documentContext}
            loading={loading}
            schemaType={schemaType}
          />
        </ScrollContainer>
      </TooltipProvider>
    </div>
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

function SinceText({since}: {since: Chunk}): React.ReactElement {
  const timeAgo = useTimeAgo(since.endTimestamp, {agoSuffix: true})

  return (
    <>
      Since {formatTimelineEventLabel(since.type)} {timeAgo}
    </>
  )
}
